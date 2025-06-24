'use client'

const LoadingSpinner = ({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) => {
  const sizeClasses = {
    sm: 'w-2 h-2',
    md: 'w-3 h-3',
    lg: 'w-4 h-4',
  };
  const containerClasses = {
    sm: 'h-8',
    md: 'h-12',
    lg: 'h-16',
  }

  return (
    <div className={`flex justify-center items-center ${containerClasses[size]}`}>
      <div className="flex space-x-2">
        <div className={`bg-white rounded-full animate-bounce [animation-delay:-0.3s] ${sizeClasses[size]}`}></div>
        <div className={`bg-white rounded-full animate-bounce [animation-delay:-0.15s] ${sizeClasses[size]}`}></div>
        <div className={`bg-white rounded-full animate-bounce ${sizeClasses[size]}`}></div>
      </div>
    </div>
  );
};

export default LoadingSpinner;
