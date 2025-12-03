import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Shield, Loader2, ArrowLeft } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

export function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login, isLoading, user } = useAuth();
  const navigate = useNavigate();

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    const success = await login(email, password);
    if (success) {
      // Navigation will happen automatically via useEffect
    } else {
      setError('Invalid email or password');
    }
  };

  const testCredentials = [
    { 
      email: 'admin@tracevision.com', 
      password: 'admin123', 
      role: 'Admin', 
      color: 'bg-red-100 text-red-800' 
    },
    { 
      email: 'sarah.johnson@police.gov', 
      password: 'police123', 
      role: 'Case Manager', 
      color: 'bg-blue-100 text-blue-800' 
    },
    { 
      email: 'mike.chen@police.gov', 
      password: 'officer123', 
      role: 'Field Officer', 
      color: 'bg-green-100 text-green-800' 
    },
    {
      email: 'citizen@tracevision.com',
      password: 'citizen123',
      role: 'Public Citizen',
      color: 'bg-yellow-100 text-yellow-800'
    },
  ];

  const quickLogin = (credentials: typeof testCredentials[0]) => {
    setEmail(credentials.email);
    setPassword(credentials.password);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center p-4">
      {/* Back to Home Button */}
      <div className="absolute top-6 left-6 z-10">
        <Link to="/">
          <Button variant="ghost" size="sm" className="text-gray-600 hover:text-gray-900">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Home
          </Button>
        </Link>
      </div>

      {/* Main Card Container */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-4xl bg-white dark:bg-gray-800 rounded-2xl shadow-2xl overflow-hidden"
      >
        <div className="flex min-h-[500px]">
          {/* Left Side - Login Form */}
          <div className="flex-1 p-8 flex flex-col justify-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="max-w-sm mx-auto w-full space-y-6"
            >
              {/* Logo and Title */}
              <div className="text-center">
                <motion.div
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="flex justify-center mb-4"
                >
                  <div className="p-2 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl shadow-lg">
                    <Shield className="h-8 w-8 text-white" />
                  </div>
                </motion.div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
                  Welcome back
                </h1>
                <p className="text-gray-600 dark:text-gray-300 text-sm">
                  New to the platform? <Link to="/signup" className="text-blue-600 hover:text-blue-700 font-medium">Create an account</Link>
                </p>
              </div>

              {/* Login Form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                  >
                    <Alert variant="destructive">
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  </motion.div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Email Address
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={isLoading}
                    className="h-10 text-sm border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Password
                  </Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={isLoading}
                    className="h-10 text-sm border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <input
                      id="remember-me"
                      name="remember-me"
                      type="checkbox"
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                      Remember me
                    </label>
                  </div>
                  <a href="#" className="text-sm text-blue-600 hover:text-blue-700 font-medium">
                    Forgot password?
                  </a>
                </div>

                <Button 
                  type="submit" 
                  className="w-full h-10 text-sm font-medium bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 rounded-lg"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Signing in...
                    </>
                  ) : (
                    'Sign in'
                  )}
                </Button>
              </form>

              {/* Test Credentials */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="mt-6"
              >
                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3 border border-dashed border-gray-300">
                  <h4 className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center">
                    <Shield className="h-3 w-3 mr-1 text-blue-600" />
                    Quick Login for Testing
                  </h4>
                  <div className="space-y-1">
                    {testCredentials.map((cred, index) => (
                      <button
                        key={index}
                        type="button"
                        onClick={() => quickLogin(cred)}
                        className="w-full text-left p-2 bg-white dark:bg-gray-600 rounded-md border border-gray-200 dark:border-gray-500 hover:shadow-sm transition-all duration-200 hover:border-blue-300 group"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-1 mb-1">
                              <Badge className={`${cred.color} text-xs`}>
                                {cred.role}
                              </Badge>
                            </div>
                            <div className="text-xs text-gray-600 dark:text-gray-300 font-medium">
                              {cred.email}
                            </div>
                          </div>
                          <div className="text-xs text-blue-600 group-hover:text-blue-700 font-medium">
                            Use
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </motion.div>
            </motion.div>
          </div>

          {/* Right Side - Illustration */}
          <div className="hidden lg:flex flex-1 bg-gradient-to-br from-blue-600 to-purple-600 relative overflow-hidden">
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="flex-1 flex items-center justify-center p-8"
            >
              <div className="relative w-full max-w-xs">
                <img
                  src="https://i.ibb.co/c8r6gFs/4957136.jpg"
                  alt="Missing Persons Detection Technology"
                  className="w-full h-auto rounded-xl shadow-xl"
                />
                
                {/* Overlay Content */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent rounded-xl flex items-end p-4">
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.8 }}
                    className="text-white"
                  >
                    <h3 className="text-lg font-bold mb-1">
                      Advanced AI Technology
                    </h3>
                    <p className="text-xs opacity-90">
                      Helping reunite families through cutting-edge facial recognition and real-time monitoring systems.
                    </p>
                  </motion.div>
                </div>
              </div>
            </motion.div>
            
            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-10">
              <div className="absolute -right-12 -top-12 w-48 h-48 bg-white rounded-full"></div>
              <div className="absolute -left-12 -bottom-12 w-36 h-36 bg-white rounded-full"></div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
