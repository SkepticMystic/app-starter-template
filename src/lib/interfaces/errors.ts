export interface HTTPError<
  T = {
    message: string;
    status: number;
  },
> {
  response: { data: T };
}
