import React from 'react'

type Props = {
  children: React.ReactNode;
};

export const AuthLayout = ({ children } : Props) => {
  return (
    <div className="authStyles min-h-screen flex items-center justify-center bg-transparent">
      <div className="authformStyles w-full max-w-[400px] bg-white shadow-lg rounded-xl p-6 pt-4">
        {children}
      </div>
    </div>
  )
}
