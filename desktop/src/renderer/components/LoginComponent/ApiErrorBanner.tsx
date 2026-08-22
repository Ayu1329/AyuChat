interface ApiErrorBannerProps {
  message: string | null;
}

export default function ApiErrorBanner({ message }: ApiErrorBannerProps) {
  if (!message) return null;

  return (
    <p
      className="mb-3 rounded-lg bg-danger/10 px-3 py-2 text-sm text-danger"
      role="alert"
    >
      {message}
    </p>
  );
}
