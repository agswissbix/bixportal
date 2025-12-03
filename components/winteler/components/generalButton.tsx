type ButtonProps = {
    text: string;
    action?: () => void; 
    type?: 'button' | 'submit' | 'reset';
    className?: string;
    disabled?: boolean;
};

export default function GeneralButton({ text, action, type = 'button', disabled = false, className }: ButtonProps) {

    const baseClasses = "w-full bg-black text-white py-3 hover:bg-gray-800 transition-colors shadow-md tracking-wider";

    return (
        <button
            type={type}
            className={`${baseClasses} ${className}`}
            onClick={action}
            disabled={disabled}
        >
            {text.toUpperCase()}
        </button>
    );
}