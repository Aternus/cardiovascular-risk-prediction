export const formatDateToYMD = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

export const parseDateFromYMD = (value: string) => {
  if (!value) {
    return undefined;
  }

  const parts = value.split("-");
  if (parts.length !== 3) {
    return undefined;
  }

  const [year, month, day] = parts.map(Number);
  if (!year || !month || !day) {
    return undefined;
  }

  return new Date(year, month - 1, day);
};
