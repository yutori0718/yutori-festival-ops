export const statuses = ['未着手','対応中','確認待ち','承認待ち','完了','保留'] as const;
export type Status = typeof statuses[number];
export type Task = {id:string; title:string; status:Status; progress:number; dueDate:string; priority:string; nextAction:string; assigneeIds:string[]; archived:boolean; revision:number; metadata?:string; updatedAt?:{seconds:number}|null};
export function validProgress(status:Status, value:number) { return Number.isInteger(value) && value>=0 && (status==='完了' ? value===100 : value<100); }
export function isOverdue(task:Task, today:string) {return !!task.dueDate && task.dueDate<today && task.status!=='完了' && !task.archived;}
export function todayTokyo() {return new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Tokyo',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());}
