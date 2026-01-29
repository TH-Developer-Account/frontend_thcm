import React from 'react'

type Props = {
  children: React.ReactNode;
};

export const AuthLayout = ({ children } : Props) => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-transparent">
      <div className="w-full max-w-md bg-white shadow-lg rounded-xl p-8 pt-4">
        {children}
      </div>
    </div>
  )
}
