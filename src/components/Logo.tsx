import React from "react";

// Define the prop type for the Logo component
interface LogoProps {
  className?: string;
}

export const Logo: React.FC<LogoProps> = ({ className }) => {
  return (
    <div className={`flex flex-col items-start ${className}`}>
      <div className="text-3xl font-bold leading-none">
        <span className="text-red-600">Big</span>
        <span className="text-black">basket</span>
      </div>
      <div className="text-blue-600 text-sm font-medium mt-1">
        A TATA Enterprise
      </div>
    </div>
  );
};
