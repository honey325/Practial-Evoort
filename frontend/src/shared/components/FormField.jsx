export function FormField({ type = "text", ...props }) {
  const { label, description, className = "", ...inputProps } = props;
  const id = inputProps.id || inputProps.name;
  return (
    <label className={`form-field ${className}`} htmlFor={id}>
      <span className="field-label">{label}</span>
      <input
        {...inputProps}
        id={id}
        type={type}
        autoComplete={inputProps.autoComplete || (type === "email" ? "email" : type === "password" ? "current-password" : undefined)}
        className="text-input"
      />
      {description && <span className="field-description">{description}</span>}
    </label>
  );
}
