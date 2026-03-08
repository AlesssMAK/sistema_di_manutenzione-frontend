import { forwardRef, useState } from 'react';
import css from './Input.module.css';

interface inputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

const Input = forwardRef<HTMLInputElement, inputProps>(
  ({ error, type, className, ...rest }, ref) => {
    const [show, setShow] = useState(false);

    const isPassword = type === 'password';
    const inputType = isPassword ? (show ? 'text' : 'password') : type;
    return (
      <div className={css.input_container}>
        <input
          ref={ref}
          type={inputType}
          className={`${css.input} ${error ? css.error : ''} ${className || ''}`}
          {...rest}
        />
        {error && <p className={css.error_text}>{error}</p>}
      </div>
    );
  }
);

export default Input;
