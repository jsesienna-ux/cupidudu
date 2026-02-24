export function CoinBalance({ coins }: { coins: number }) {
  return (
    <div className="flex justify-end px-2 py-2">
      <span className="rounded-full bg-cupid-pinkSoft/70 px-3 py-1 text-sm font-semibold text-cupid-pinkDark">
        🪙 {coins} 코인
      </span>
    </div>
  );
}
