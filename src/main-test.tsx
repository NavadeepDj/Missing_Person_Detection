// Minimal test to check if JavaScript is loading
console.log('🧪 TEST: Minimal main-test.tsx loaded!')

document.addEventListener('DOMContentLoaded', () => {
  console.log('🧪 TEST: DOM content loaded')

  const root = document.getElementById('root')
  if (root) {
    console.log('🧪 TEST: Root element found, updating content...')
    root.innerHTML = `
      <div style="
        display: flex;
        justify-content: center;
        align-items: center;
        height: 100vh;
        font-family: monospace;
        color: #333;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        margin: 0;
        padding: 20px;
      ">
        <div style="
          background: white;
          padding: 40px;
          border-radius: 20px;
          box-shadow: 0 20px 40px rgba(0,0,0,0.1);
          text-align: center;
          max-width: 500px;
        ">
          <h1 style="color: #4CAF50; margin-bottom: 20px;">✅ JavaScript is Working!</h1>
          <p style="font-size: 18px; margin-bottom: 20px;">The minimal test is loading correctly.</p>
          <p style="color: #666; margin-bottom: 30px;">This means the server and basic JavaScript execution are working.</p>
          <div style="
            background: #f0f0f0;
            padding: 20px;
            border-radius: 10px;
            margin-bottom: 20px;
          ">
            <h3 style="margin-top: 0; color: #333;">Next Steps:</h3>
            <ol style="text-align: left; margin: 10px 0;">
              <li>Check browser console for errors in the full app</li>
              <li>Look for import/module resolution issues</li>
              <li>Test the React components individually</li>
            </ol>
          </div>
          <button
            onclick="window.location.href='/src/main.tsx'"
            style="
              background: #4CAF50;
              color: white;
              border: none;
              padding: 15px 30px;
              border-radius: 8px;
              font-size: 16px;
              cursor: pointer;
              margin-right: 10px;
            "
          >
            Try Full App Again
          </button>
          <button
            onclick="console.clear(); location.reload()"
            style="
              background: #2196F3;
              color: white;
              border: none;
              padding: 15px 30px;
              border-radius: 8px;
              font-size: 16px;
              cursor: pointer;
            "
          >
            Clear Console & Reload
          </button>
        </div>
      </div>
    `
    console.log('✅ TEST: Root element updated successfully!')
  } else {
    console.error('❌ TEST: Root element not found!')
  }
})

// Test error handling
try {
  console.log('🧪 TEST: Testing basic JavaScript functionality...')
  const testArray = [1, 2, 3]
  const testObject = { name: 'Test', value: 42 }
  console.log('🧪 TEST: Basic operations work:', testArray, testObject)
} catch (error) {
  console.error('❌ TEST: Basic JavaScript error:', error)
}

console.log('🧪 TEST: main-test.tsx script finished loading!')