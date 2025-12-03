import argparse
import os
import sys
from typing import Tuple

import piexif
from PIL import Image


def to_deg(value: float) -> Tuple[Tuple[int, int], Tuple[int, int], Tuple[int, int]]:
    """Convert decimal degrees to degrees, minutes, seconds tuple as rationals.

    Returns ((deg,1),(min,1),(sec,10000)) where seconds are scaled by 10000 to preserve
    fractional seconds as an integer numerator/denominator pair.
    """
    deg = int(value)
    min_float = (value - deg) * 60
    minutes = int(min_float)
    sec = round((min_float - minutes) * 60 * 10000)
    return ((deg, 1), (minutes, 1), (sec, 10000))


def add_gps_to_image(image_path: str, lat: float, lon: float, overwrite: bool = False) -> None:
    """Add GPS EXIF tags to a JPEG/TIFF image while preserving existing EXIF.

    This function will refuse to write to non-JPEG/TIFF images.
    """
    if not os.path.isfile(image_path):
        raise FileNotFoundError(f"File not found: {image_path}")

    # Open image to inspect format and existing EXIF
    with Image.open(image_path) as img:
        img_format = img.format
        existing_exif = img.info.get('exif')

    if img_format not in ("JPEG", "TIFF"):
        raise ValueError(f"Unsupported image format: {img_format}. Only JPEG and TIFF are supported for EXIF.")

    # Load or initialize EXIF dict
    if existing_exif:
        exif_dict = piexif.load(existing_exif)
    else:
        exif_dict = {"0th": {}, "Exif": {}, "GPS": {}, "1st": {}, "thumbnail": None}

    # If GPS data exists and we are not overwriting, abort
    if exif_dict.get('GPS') and exif_dict['GPS'] and not overwrite:
        raise RuntimeError("Image already contains GPS EXIF data. Use --force to overwrite.")

    # Prepare GPS IFD
    lat_dms = to_deg(abs(lat))
    lon_dms = to_deg(abs(lon))
    lat_ref = 'N' if lat >= 0 else 'S'
    lon_ref = 'E' if lon >= 0 else 'W'

    gps_ifd = {
        piexif.GPSIFD.GPSLatitudeRef: lat_ref.encode('ascii'),
        piexif.GPSIFD.GPSLatitude: lat_dms,
        piexif.GPSIFD.GPSLongitudeRef: lon_ref.encode('ascii'),
        piexif.GPSIFD.GPSLongitude: lon_dms,
    }

    # Merge GPS IFD into existing EXIF
    exif_dict['GPS'] = gps_ifd

    exif_bytes = piexif.dump(exif_dict)

    # Write EXIF back into file
    piexif.insert(exif_bytes, image_path)
    print(f"✅ GPS data added to: {image_path}")


def parse_args() -> argparse.Namespace:
    p = argparse.ArgumentParser(description="Embed GPS EXIF into a JPEG/TIFF image while preserving existing EXIF.")
    p.add_argument('image', help='Path to the image file (JPEG/TIFF)')
    p.add_argument('lat', type=float, help='Latitude in decimal degrees (e.g. 9.574639)')
    p.add_argument('lon', type=float, help='Longitude in decimal degrees (e.g. 77.679861)')
    p.add_argument('--force', '-f', action='store_true', help='Overwrite existing GPS EXIF if present')
    return p.parse_args()


if __name__ == '__main__':
    args = parse_args()

    # Basic validation
    if not os.path.isfile(args.image):
        print(f"❌ File not found: {args.image}")
        sys.exit(2)

    if not (-90.0 <= args.lat <= 90.0):
        print("❌ Latitude must be between -90 and 90")
        sys.exit(3)

    if not (-180.0 <= args.lon <= 180.0):
        print("❌ Longitude must be between -180 and 180")
        sys.exit(4)

    try:
        add_gps_to_image(args.image, args.lat, args.lon, overwrite=args.force)
    except RuntimeError as e:
        print(f"❌ {e}")
        sys.exit(5)
    except ValueError as e:
        print(f"❌ {e}")
        sys.exit(6)
    except FileNotFoundError as e:
        print(f"❌ {e}")
        sys.exit(2)
    except Exception as e:
        print(f"❌ Unexpected error: {e}")
        sys.exit(10)