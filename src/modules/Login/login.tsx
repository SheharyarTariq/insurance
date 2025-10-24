import React, { useState,useEffect } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import logoImage from '../../assets/images/Logo.png';
import { useNavigate, Link } from 'react-router-dom';
import { login } from '../../services/Authentication/auth';
import accidentImage from '../../assets/images/1cbcac34591b113950559367e9110f4f4c7bcec3.png'


const Login: React.FC = () => {
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [rememberMe, setRememberMe] = useState<boolean>(false);
  const [, setError] = useState<string>('');
  const [, setIsLoading] = useState<boolean>(false);
  const navigate = useNavigate();
  useEffect(() => {
    const storedToken = localStorage.getItem("authToken") || sessionStorage.getItem("authToken");
    if (storedToken) {
      // Already logged in, redirect
      navigate("/");
    }
  }, [navigate]);
  
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);
  
    try {
      const data = await login({
        user_name: email,
        password,
      });
  
      localStorage.setItem("authToken", data.access_token);   
      localStorage.setItem("user_name", data.first_name);   
      navigate("/");
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("An unknown error occurred.");
      }
      console.error("Login error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
      <div className="min-h-screen bg-gray-50 flex">
        {/* Left side - Login Form */}
        <div className="flex-1 flex flex-col justify-center px-4 sm:px-6 lg:px-20 xl:px-24">
          <div className="mx-auto w-full max-w-sm lg:w-96">
            {/* Logo */}
            <div className="mb-8">
              <div className="flex items-center">
                <img src={logoImage} alt="ProClaim Logo" className="object-contain" />
              </div>
            </div>

            {/* Form */}
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-2">Log in</h2>
              <p className="text-gray-600 mb-8">Welcome back! Please enter your details.</p>

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Email Field */}
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                    Email
                  </label>
                  <input
                      id="email"
                      name="email"
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-700 focus:border-purple-700"
                      placeholder="Enter your email"
                  />
                </div>

                {/* Password Field */}
                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                    Password
                  </label>
                  <div className="relative">
                    <input
                        id="password"
                        name="password"
                        type={showPassword ? 'text' : 'password'}
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-700 focus:border-purple-700"
                        placeholder="••••••••"
                    />
                    <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    >
                      {showPassword ? (
                          <EyeOff className="h-4 w-4 text-gray-400" />
                      ) : (
                          <Eye className="h-4 w-4 text-gray-400" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Remember me and Forgot password */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <input
                        id="remember-me"
                        name="remember-me"
                        type="checkbox"
                        checked={rememberMe}
                        onChange={(e) => setRememberMe(e.target.checked)}
                        className="h-4 w-4 text-custom border-gray-300 rounded"
                    />
                    <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-700">
                      Remember for 30 days
                    </label>
                  </div>
                  <div className="text-sm">
                    <Link to="/forgot-password" className="font-medium text-custom hover:bg-[#252B37]">
                      Forgot password
                    </Link>
                  </div>
                </div>

                {/* Sign in button */}
                <div>
                  <button
                      type="submit"
                      className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-custom hover:bg-[#252B37] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-600 transition-colors"
                  >
                    Sign in
                  </button>
                </div>

                {/* Google sign in */}
                <div>
                  <button
                      type="button"
                      className="w-full flex justify-center items-center py-2.5 px-4 border border-gray-300 rounded-lg shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 transition-colors"
                  >
                    <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                      <path
                          fill="#4285F4"
                          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                          fill="#34A853"
                          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                          fill="#FBBC05"
                          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                      />
                      <path
                          fill="#EA4335"
                          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      />
                    </svg>
                    Sign in with Google
                  </button>
                </div>
              </form>

              {/* Sign up link */}
              <p className="mt-6 text-center text-sm text-gray-600">
                Don't have an account?{' '}
                <Link to="/signup" className="font-medium text-custom hover:text-[#252B37]">
                  Sign up
                </Link>
              </p>
            </div>
          </div>
        </div>

        {/* Right side - Device mockup */}
        <div className="hidden lg:block relative w-0 flex-1">
          <div className="absolute inset-0 bg-gray-100 flex items-center justify-end">
            {/* <div className="w-96 h-2/3 bg-white rounded-l-3xl shadow-2xl border-r-0 border-4 border-gray-800 overflow-hidden"> */}
              {/* <div className="w-full h-full bg-gray-300 flex items-center justify-center"> */}
                {/* <div className="text-center p-8"> */}
                  <img src={accidentImage} alt='' />
                {/* </div> */}
              {/* </div> */}
            {/* </div> */}
          </div>
        </div>
      </div>
  );
};

export default Login;