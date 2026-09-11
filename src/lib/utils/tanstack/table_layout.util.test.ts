import { describe, expect, it } from "vite-plus/test";
import {
  cell_title,
  empty_colspan,
  offset_of_page,
  page_of_offset,
  grouped_visibility,
  count_label,
  header_label,
  row_id,
  rows_keyable_by_id,
} from "./table_layout.util";

describe("header_label", () => {
  it("prefers meta.label over every other source", () => {
    expect(
      header_label(
        { meta: { label: "Cell number" }, accessorKey: "phone_e164" },
        "phone_e164",
      ),
    ).toBe("Cell number");
  });

  it("keeps an empty meta.label, because a column can want no heading", () => {
    // `/settings/api-key` sets `meta: { label: "" }` deliberately. A truthiness check here would fall
    // through to the accessorKey and reinstate the heading the caller went out of their way to remove.
    expect(
      header_label({ meta: { label: "" }, accessorKey: "start" }, "start"),
    ).toBe("");
  });

  it("falls back to the accessorKey", () => {
    expect(header_label({ accessorKey: "email" }, "email")).toBe("email");
  });

  it("falls back to the column id for a computed accessor", () => {
    expect(header_label({ accessorFn: () => "x" }, "counterparty")).toBe(
      "counterparty",
    );
  });

  it("renders a numeric accessorKey", () => {
    expect(header_label({ accessorKey: 0 }, "first")).toBe("0");
  });

  it('declines to stringify a key path that is not one, rather than heading a column "[object Object]"', () => {
    expect(header_label({ accessorKey: {}, accessorFn: () => "x" }, "id")).toBe(
      "id",
    );
  });

  it("returns null for a display column, so it renders no heading", () => {
    // The `/admin/users` avatar case: a heading here would print "avatar" over a
    // column of pictures.
    expect(header_label({}, "avatar")).toBeNull();
  });
});

describe("empty_colspan", () => {
  it("counts the visible leaf columns alone when there is nothing either side", () => {
    expect(
      empty_colspan({
        visible_leaf_columns: 4,
        selection: false,
        actions: false,
      }),
    ).toBe(4);
  });

  it("adds a column for the selection checkbox", () => {
    expect(
      empty_colspan({
        visible_leaf_columns: 4,
        selection: true,
        actions: false,
      }),
    ).toBe(5);
  });

  it("adds a column for each of selection and actions", () => {
    expect(
      empty_colspan({
        visible_leaf_columns: 4,
        selection: true,
        actions: true,
      }),
    ).toBe(6);
  });
});

describe("grouped_visibility", () => {
  const columns = [
    { id: "org_name", groupable: true },
    { id: "status", groupable: true },
    { id: "phone_e164", groupable: false },
  ];

  it("hides the other groupable columns while grouped", () => {
    expect(grouped_visibility(columns, ["org_name"], {})).toEqual({
      org_name: true,
      status: false,
    });
  });

  it("brings the newly grouped column back into view", () => {
    // Regrouping A -> B. B was hidden because A was the grouping; leaving it hidden would group the
    // table by a column with nothing on screen naming the groups.
    expect(grouped_visibility(columns, ["status"], { status: false })).toEqual({
      org_name: false,
      status: true,
    });
  });

  it("leaves the grouped column and every non-groupable one alone", () => {
    const next = grouped_visibility(columns, ["org_name"], {});

    expect(next).not.toHaveProperty("phone_e164");
  });

  it("never un-hides a non-groupable column the user hid", () => {
    // The regression this function exists to prevent: grouping used to call `toggleVisibility(true)` on
    // everything non-groupable, so it revealed columns that had been deliberately switched off.
    expect(
      grouped_visibility(columns, ["org_name"], { phone_e164: false }),
    ).toEqual({ phone_e164: false, org_name: true, status: false });
  });

  it("is the identity when nothing is grouped", () => {
    const current = { phone_e164: false };

    expect(grouped_visibility(columns, [], current)).toBe(current);
  });
});

describe("rows_keyable_by_id", () => {
  it("is true when every row carries a string id", () => {
    expect(rows_keyable_by_id([{ id: "a" }, { id: "b" }])).toBe(true);
  });

  it("is false as soon as one row does not", () => {
    expect(rows_keyable_by_id([{ id: "a" }, { member_id: null }])).toBe(false);
  });

  it("is false for a non-string id", () => {
    // A number would stringify, but `getRowId` promises a string and the mismatch
    // only surfaces once something keys selection on it.
    expect(rows_keyable_by_id([{ id: 1 }])).toBe(false);
  });

  it("is true for no rows at all, which keys nothing either way", () => {
    expect(rows_keyable_by_id([])).toBe(true);
  });
});

describe("row_id", () => {
  it("uses the row's own id when the set is keyable by id", () => {
    expect(row_id({ id: "c-1", name: "Ada" }, 3, true)).toBe("c-1");
  });

  it("uses the index for every row when the set is not", () => {
    // `String(undefined)` would hand every id-less row the literal "undefined" —
    // a duplicate key, which a keyed `{#each}` turns into a crash.
    expect(row_id({ member_id: null }, 0, false)).toBe("0");
    expect(row_id({ member_id: null }, 1, false)).toBe("1");
  });

  it("never mixes the two namespaces, so an id cannot collide with an index", () => {
    // The collision this guards: a row whose id is literally "3" in a set where another row has no id at
    // all. Deciding per set rather than per row means the id-keyed reading is simply never taken here.
    const data = [{ member_id: null }, { id: "3" }];
    const keyable = rows_keyable_by_id(data);

    const keys = data.map((row, index) => row_id(row, index, keyable));

    expect(keys).toEqual(["0", "1"]);
  });

  it("produces distinct keys across a whole id-less set", () => {
    const data = [{ a: 1 }, { a: 2 }, { a: 3 }];
    const keyable = rows_keyable_by_id(data);

    const keys = data.map((row, index) => row_id(row, index, keyable));

    expect(new Set(keys).size).toBe(data.length);
  });
});

describe("cell_title", () => {
  it("promises the text of a string cell", () => {
    expect(cell_title("+27 82 000 0000", true)).toBe("+27 82 000 0000");
  });

  it("promises the text of a number cell", () => {
    expect(cell_title(42, true)).toBe("42");
  });

  it("gives no tooltip for a cell that formats its value", () => {
    // The accessor value, not the text on screen: a status column rendering a Badge
    // would otherwise promise `"no-answer"` under a cell reading "No answer".
    expect(cell_title("no-answer", false)).toBeUndefined();
  });

  it("gives no tooltip for a rendered component", () => {
    // `String({})` is "[object Object]", which reads as a value rather than as
    // the absence of one.
    expect(cell_title({ component: true }, true)).toBeUndefined();
  });

  it("gives no tooltip for an absent value", () => {
    expect(cell_title(null, true)).toBeUndefined();
    expect(cell_title(undefined, true)).toBeUndefined();
  });
});

describe("page_of_offset / offset_of_page", () => {
  it("round-trips a page boundary", () => {
    expect(page_of_offset(100, 50)).toEqual({ pageIndex: 2, pageSize: 50 });
    expect(offset_of_page({ pageIndex: 2, pageSize: 50 })).toBe(100);
  });

  it("floors an offset that lands mid-page", () => {
    expect(page_of_offset(120, 50)).toEqual({ pageIndex: 2, pageSize: 50 });
  });

  it("survives a zero limit rather than dividing by it", () => {
    expect(page_of_offset(100, 0)).toEqual({ pageIndex: 0, pageSize: 0 });
  });

  it("reads an unpaginated table as offset zero, not NaN", () => {
    // `states.pagination: false` is `pageSize: Infinity`, and `0 * Infinity` is
    // NaN — which would reach the pager as a skip and render "NaN / 1".
    expect(
      offset_of_page({ pageIndex: 0, pageSize: Number.POSITIVE_INFINITY }),
    ).toBe(0);
  });
});

describe("count_label", () => {
  it("pluralises by default", () => {
    expect(count_label(12, "contact")).toBe("12 contacts");
  });

  it("uses the singular for exactly one", () => {
    expect(count_label(1, "contact")).toBe("1 contact");
  });

  it("pluralises zero, which is what every one of these headers wanted", () => {
    expect(count_label(0, "contact")).toBe("0 contacts");
  });

  it("takes an irregular plural, because `deliverys` is what the default gives", () => {
    expect(count_label(3, ["delivery", "deliveries"])).toBe("3 deliveries");
    expect(count_label(1, ["delivery", "deliveries"])).toBe("1 delivery");
  });

  it("formats the number, so a five-figure total is readable", () => {
    // The group separator is a property of the app locale (`en-ZA` groups with
    // a space, `en-US` with a comma), not of `count_label` — so assert that
    // grouping happened rather than which character did it.
    expect(count_label(50000, "contact")).toMatch(/^50\D000 contacts$/u);
  });
});
