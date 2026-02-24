export function SuccessMessage({ message }: { message: string }) {
  return (
    <div className="mx-4 mb-4 rounded-xl bg-cupid-pinkSoft/50 px-4 py-3 text-center text-sm font-medium text-cupid-pinkDark">
      {message}
    </div>
  );
}
