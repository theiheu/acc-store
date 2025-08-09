export function formatVND(amount: number, suffix = " đ") {
  const rounded = Math.round(amount || 0);
  return new Intl.NumberFormat("vi-VN").format(rounded) + suffix;
}

