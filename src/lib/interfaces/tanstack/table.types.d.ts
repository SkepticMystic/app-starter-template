import "@tanstack/table-core";

declare module "@tanstack/table-core" {
  interface ColumnMeta<_TData extends RowData, _TValue> {
    /** NOTE: Use when passing a snippet/component to `header`
     * (In this case, column.columnDef.header is a big html mess)
     */
    label?: string;
  }
}
