// Node 24 and Vite both consume this pure rule; use UTC calendar dates everywhere.
export const utcDate = () => new Date().toISOString().slice(0, 10);
export function submissionsOpen(
  project: { status: string; startDate: string; endDate: string },
  today = utcDate(),
) {
  return (
    project.status === "active" &&
    today >= project.startDate &&
    today <= project.endDate
  );
}
