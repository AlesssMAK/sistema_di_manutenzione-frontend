interface ButtonProps {
  className: string;
  onClick?: () => void;
  children: React.ReactNode;
  type?: 'button' | 'submit' | 'reset';
  disabled?: boolean;
  width?: string | number;
  height?: string | number;
}

const Button = ({
  className,
  onClick,
  children,
  type = 'button',
  disabled = false,
  width,
  height,
}: ButtonProps) => {
  return (
    <button
      className={className}
      onClick={onClick}
      type={type}
      disabled={disabled}
      style={{
        width,
        height,
      }}
    >
      {children}
    </button>
  );
};

export default Button;
