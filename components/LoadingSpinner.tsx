'use client'

const LoadingSpinner = ({ 
  size = 'md', 
  color = 'white' 
}: { 
  size?: 'sm' | 'md' | 'lg'
  color?: 'white' | 'pink' | 'blue' | 'gray' | 'primary'
}) => {
  const sizeClasses = {
    sm: 'w-2.5 h-2.5',
    md: 'w-3.5 h-3.5',
    lg: 'w-5 h-5',
  };
  
  const containerClasses = {
    sm: 'h-8',
    md: 'h-12',
    lg: 'h-20',
  }

  const colorClasses = {
    white: 'bg-white shadow-md',
    pink: 'bg-pink-400 shadow-md',
    blue: 'bg-blue-400 shadow-md', 
    gray: 'bg-gray-500 shadow-md',
    primary: 'bg-gradient-to-r from-pink-400 to-blue-400 shadow-lg'
  }

  return (
    <div className={`flex justify-center items-center ${containerClasses[size]}`}>
      <div className="flex space-x-1.5">
        <div 
          className={`${colorClasses[color]} rounded-full animate-bounce border border-white/20 [animation-delay:-0.32s] ${sizeClasses[size]}`}
          style={{ animationDuration: '1.4s' }}
        ></div>
        <div 
          className={`${colorClasses[color]} rounded-full animate-bounce border border-white/20 [animation-delay:-0.16s] ${sizeClasses[size]}`}
          style={{ animationDuration: '1.4s' }}
        ></div>
        <div 
          className={`${colorClasses[color]} rounded-full animate-bounce border border-white/20 ${sizeClasses[size]}`}
          style={{ animationDuration: '1.4s' }}
        ></div>
      </div>
    </div>
  );
};

export default LoadingSpinner;
