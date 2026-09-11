import type { DataTableFilter } from "$lib/interfaces/tanstack/table.type";
import { CalendarDate } from "@internationalized/date";
import { describe, expect, it } from "vite-plus/test";
import { TableFilters } from "./table_filter.util";

const SEARCH: DataTableFilter = { kind: "search", id: "search" };
const STATUS: DataTableFilter = {
  kind: "multi",
  id: "status",
  options: [
    { value: "active", label: "Active" },
    { value: "canceled", label: "Canceled" },
  ],
};
const CREATED: DataTableFilter = { kind: "date_range", id: "createdAt" };
const day = (d: number) => new CalendarDate(2026, 8, d);

const BANNED: DataTableFilter = {
  kind: "select",
  id: "banned",
  options: [
    { value: true, label: "Banned" },
    { value: false, label: "Not banned" },
  ],
};

describe("is_empty_value", () => {
  it("treats an unset select as empty", () => {
    expect(TableFilters.is_empty_value(undefined)).toBe(true);
  });

  it("treats a seeded null as empty", () => {
    expect(TableFilters.is_empty_value(null)).toBe(true);
  });

  it("treats an emptied search box as empty", () => {
    expect(TableFilters.is_empty_value("")).toBe(true);
  });

  it("treats a multi with nothing ticked as empty", () => {
    expect(TableFilters.is_empty_value([])).toBe(true);
  });

  it("keeps `false`, which is a real choice on a Banned filter", () => {
    expect(TableFilters.is_empty_value(false)).toBe(false);
  });

  it("keeps `0`, which a numeric filter can legitimately be set to", () => {
    expect(TableFilters.is_empty_value(0)).toBe(false);
  });

  it("keeps a one-element array", () => {
    expect(TableFilters.is_empty_value(["pending"])).toBe(false);
  });
});

describe("seeded", () => {
  it("is empty for a table that seeds nothing", () => {
    expect(TableFilters.seeded()).toEqual({
      column_filters: [],
      global_filter: "",
    });
  });

  it("hands back the view the page seeded", () => {
    expect(
      TableFilters.seeded({
        column_filters: [{ id: "status", value: ["pending"] }],
        global_filter: "",
      }),
    ).toEqual({
      column_filters: [{ id: "status", value: ["pending"] }],
      global_filter: "",
    });
  });

  it("reads a `false` — the feature off — as seeding nothing", () => {
    expect(
      TableFilters.seeded({ column_filters: false, global_filter: false }),
    ).toEqual({ column_filters: [], global_filter: "" });
  });
});

describe("is_filtering_columns", () => {
  it("is false when nothing is set and nothing was seeded", () => {
    expect(TableFilters.is_filtering_columns([], [])).toBe(false);
  });

  it("is true as soon as one control holds something", () => {
    expect(
      TableFilters.is_filtering_columns(
        [{ id: "status", value: ["pending"] }],
        [],
      ),
    ).toBe(true);
  });

  it("is false for a seeded default view nobody has touched", () => {
    // The invitations table opens on `status: ["pending"]`. Lighting Clear there offered to undo a choice
    // the reader had not made — and did it by discarding the default view, which nothing could restore.
    const seed = [{ id: "status", value: ["pending"] }];

    expect(TableFilters.is_filtering_columns([...seed], seed)).toBe(false);
  });

  it("is true once the reader changes a seeded filter", () => {
    expect(
      TableFilters.is_filtering_columns(
        [{ id: "status", value: ["accepted"] }],
        [{ id: "status", value: ["pending"] }],
      ),
    ).toBe(true);
  });

  it("is true once the reader clears a seeded filter", () => {
    expect(
      TableFilters.is_filtering_columns(
        [],
        [{ id: "status", value: ["pending"] }],
      ),
    ).toBe(true);
  });

  it("ignores the order the controls were touched in", () => {
    expect(
      TableFilters.is_filtering_columns(
        [
          { id: "status", value: ["pending"] },
          { id: "name", value: "ross" },
        ],
        [
          { id: "name", value: "ross" },
          { id: "status", value: ["pending"] },
        ],
      ),
    ).toBe(false);
  });

  it("reads an emptied control as unset rather than as a change", () => {
    // v9's `autoRemove` usually drops these, but a seeded one can sit there — and a
    // filter matching every row is not a filter.
    expect(
      TableFilters.is_filtering_columns([{ id: "status", value: [] }], []),
    ).toBe(false);
  });

  it("is true for a `false` that is a chosen option, not an unset one", () => {
    expect(
      TableFilters.is_filtering_columns([{ id: "banned", value: false }], []),
    ).toBe(true);
  });
});

describe("is_filtering_params", () => {
  it("is false for no controls at all", () => {
    expect(TableFilters.is_filtering_params([], new URLSearchParams())).toBe(
      false,
    );
  });

  it("is false when the query string holds none of their params", () => {
    expect(
      TableFilters.is_filtering_params(
        [BANNED, STATUS],
        new URLSearchParams("offset=50&limit=100"),
      ),
    ).toBe(false);
  });

  it("is true as soon as one of their params carries a value", () => {
    expect(
      TableFilters.is_filtering_params(
        [BANNED, STATUS],
        new URLSearchParams("banned=true"),
      ),
    ).toBe(true);
  });

  it("reads a param no option carries as filtering, so it stays clearable", () => {
    // The trap this exists for: a `?key_id=` naming a key deleted since the link was sent still narrows
    // server-side but matches no option, so Clear was never rendered and the only way out was the URL.
    expect(
      TableFilters.is_filtering_params(
        [BANNED],
        new URLSearchParams("banned=banana"),
      ),
    ).toBe(true);
  });

  it("reads an empty param as no filter, because absent is how this app spells unset", () => {
    expect(
      TableFilters.is_filtering_params(
        [BANNED],
        new URLSearchParams("banned="),
      ),
    ).toBe(false);
  });

  it("looks under `param` when it differs from the column id", () => {
    const tags: DataTableFilter = {
      kind: "multi",
      id: "tags",
      param: "tag",
      options: [],
    };

    expect(
      TableFilters.is_filtering_params([tags], new URLSearchParams("tag=a")),
    ).toBe(true);
    expect(
      TableFilters.is_filtering_params([tags], new URLSearchParams("tags=a")),
    ).toBe(false);
  });
});

describe("text_value", () => {
  it("passes a string through", () => {
    expect(TableFilters.text_value("ross")).toBe("ross");
  });

  it("renders a seeded number rather than dropping it", () => {
    expect(TableFilters.text_value(42)).toBe("42");
  });

  it("renders an unset filter as an empty box", () => {
    expect(TableFilters.text_value(undefined)).toBe("");
  });

  it("refuses a shape a text box cannot show, rather than stringifying it", () => {
    expect(TableFilters.text_value(["a", "b"])).toBe("");
  });
});

describe("multi_value", () => {
  it("passes an array of ids through", () => {
    expect(TableFilters.multi_value(["pending", "accepted"])).toEqual([
      "pending",
      "accepted",
    ]);
  });

  it("returns an empty selection for an unset filter", () => {
    expect(TableFilters.multi_value(undefined)).toEqual([]);
  });

  it("does not spread a bare string into characters, which the old cast did", () => {
    expect(TableFilters.multi_value("pending")).toEqual([]);
  });

  it("drops non-string members rather than handing them to a `V extends string` select", () => {
    expect(TableFilters.multi_value(["pending", 3, null])).toEqual(["pending"]);
  });
});

describe("select_value", () => {
  it("passes a chosen string through", () => {
    expect(TableFilters.select_value("admin")).toBe("admin");
  });

  it("keeps `false`, which is a chosen option and not an unset one", () => {
    expect(TableFilters.select_value(false)).toBe(false);
  });

  it("keeps `0`", () => {
    expect(TableFilters.select_value(0)).toBe(0);
  });

  it("reads a shape no option can carry as no choice made", () => {
    expect(TableFilters.select_value(["admin"])).toBeUndefined();
  });
});

describe("select_options", () => {
  it("puts the everything-choice first so it is the top of the list", () => {
    const options = TableFilters.select_options([
      { value: "admin", label: "Admin" },
    ]);

    expect(options).toEqual([
      { value: undefined, label: "All" },
      { value: "admin", label: "Admin" },
    ]);
  });

  it('uses `undefined` and not `""`, so v9\'s autoRemove drops the filter', () => {
    const options = TableFilters.select_options([
      { value: "admin", label: "Admin" },
    ]);

    expect(options.at(0)).toEqual({ value: undefined, label: "All" });
  });

  it("takes the caller's wording for it", () => {
    const options = TableFilters.select_options(
      [{ value: "admin", label: "Admin" }],
      "Every role",
    );

    expect(options.at(0)).toEqual({ value: undefined, label: "Every role" });
  });

  it("carries non-string option values through, for a Banned filter", () => {
    expect(
      TableFilters.select_options([
        { value: true, label: "Yes" },
        { value: false, label: "No" },
      ]),
    ).toEqual([
      { value: undefined, label: "All" },
      { value: true, label: "Yes" },
      { value: false, label: "No" },
    ]);
  });

  it("leaves the caller's array alone", () => {
    const options = [{ value: "admin", label: "Admin" }];

    TableFilters.select_options(options);

    expect(options).toHaveLength(1);
  });
});

describe("read_param", () => {
  it("reads a search term", () => {
    expect(
      TableFilters.read_param(SEARCH, new URLSearchParams("search=ross")),
    ).toBe("ross");
  });

  it("reads an absent param as unset rather than as an empty term", () => {
    expect(
      TableFilters.read_param(SEARCH, new URLSearchParams()),
    ).toBeUndefined();
  });

  it("reads every value of a repeated param, so `?tag=a&tag=b` round-trips", () => {
    expect(
      TableFilters.read_param(
        STATUS,
        new URLSearchParams("status=active&status=canceled"),
      ),
    ).toEqual(["active", "canceled"]);
  });

  it("reads an absent multi as an empty selection", () => {
    expect(TableFilters.read_param(STATUS, new URLSearchParams())).toEqual([]);
  });

  it("gives a select back its option's real type, not the URL's string", () => {
    // `?banned=true` is the boolean the control is built on. Handed the
    // string, the select would show nothing selected while the server filtered.
    expect(
      TableFilters.read_param(BANNED, new URLSearchParams("banned=true")),
    ).toBe(true);
  });

  it("distinguishes a select's `false` option from its absence", () => {
    expect(
      TableFilters.read_param(BANNED, new URLSearchParams("banned=false")),
    ).toBe(false);
    expect(
      TableFilters.read_param(BANNED, new URLSearchParams()),
    ).toBeUndefined();
  });

  it("reads a hand-edited value no option carries as no choice made", () => {
    expect(
      TableFilters.read_param(BANNED, new URLSearchParams("banned=banana")),
    ).toBeUndefined();
  });

  it("reads from `param` when it differs from the column id", () => {
    const tags: DataTableFilter = {
      kind: "multi",
      id: "tags",
      param: "tag",
      options: [],
    };

    expect(
      TableFilters.read_param(tags, new URLSearchParams("tag=a&tag=b")),
    ).toEqual(["a", "b"]);
  });

  it("reads a multi-valued custom control with getAll, and a single one with get", () => {
    const many: DataTableFilter = {
      kind: "custom",
      id: "tags",
      param: "tag",
      multiple: true,
      control: (() => undefined) as never,
    };
    const one: DataTableFilter = {
      kind: "custom",
      id: "owner",
      control: (() => undefined) as never,
    };

    const params = new URLSearchParams("tag=a&tag=b&owner=me");

    expect(TableFilters.read_param(many, params)).toEqual(["a", "b"]);
    expect(TableFilters.read_param(one, params)).toBe("me");
  });
});

describe("read_params", () => {
  it("keys every control by its column id, not by its param", () => {
    const tags: DataTableFilter = {
      kind: "multi",
      id: "tags",
      param: "tag",
      options: [],
    };

    expect(
      TableFilters.read_params(
        [SEARCH, tags],
        new URLSearchParams("search=ross&tag=a"),
      ),
    ).toEqual({ search: "ross", tags: ["a"] });
  });
});

describe("write_param", () => {
  it("sets the value and sends the reader back to page one", () => {
    // The rule five of the six hand-written copies encoded separately: page 7 of
    // a result set that now has two pages renders empty and reads as broken.
    expect(TableFilters.write_param(SEARCH, "ross")).toEqual({
      search: "ross",
      offset: null,
    });
  });

  it("deletes the param when the control is emptied", () => {
    expect(TableFilters.write_param(SEARCH, "")).toEqual({
      search: null,
      offset: null,
    });
    expect(TableFilters.write_param(STATUS, [])).toEqual({
      status: null,
      offset: null,
    });
  });

  it("keeps a `false` that is a chosen option", () => {
    expect(TableFilters.write_param(BANNED, false)).toEqual({
      banned: false,
      offset: null,
    });
  });

  it("writes under `param` when the column id differs", () => {
    const tags: DataTableFilter = {
      kind: "multi",
      id: "tags",
      param: "tag",
      options: [],
    };

    expect(TableFilters.write_param(tags, ["a", "b"])).toEqual({
      tag: ["a", "b"],
      offset: null,
    });
  });
});

describe("clear_params", () => {
  it("empties every control it owns and returns to page one", () => {
    expect(TableFilters.clear_params([SEARCH, STATUS])).toEqual({
      search: null,
      status: null,
      offset: null,
    });
  });

  it("names no param it does not own, so `limit` survives a Clear", () => {
    // A Clear that rebuilt the query string would drop the reader from 100 rows
    // a page to 50 for pressing a button that said nothing about page size.
    expect(Object.keys(TableFilters.clear_params([SEARCH]))).toEqual([
      "search",
      "offset",
    ]);
  });

  it("is a no-op patch for a table with no filters", () => {
    expect(TableFilters.clear_params([])).toEqual({ offset: null });
  });
});

describe("facet_options", () => {
  it("lists the values the column actually holds, with their counts", () => {
    expect(
      TableFilters.facet_options(
        new Map<unknown, number>([
          ["Acme", 3],
          ["Globex", 1],
        ]),
      ),
    ).toEqual([
      { value: "Acme", label: "Acme (3)" },
      { value: "Globex", label: "Globex (1)" },
    ]);
  });

  it("sorts by label, so the list keeps its shape as the counts move", () => {
    expect(
      TableFilters.facet_options(
        new Map<unknown, number>([
          ["Zeta", 9],
          ["Acme", 1],
        ]),
      ).map((option) => option.value),
    ).toEqual(["Acme", "Zeta"]);
  });

  it("drops a value the control cannot carry rather than stringifying it", () => {
    // `null` would render as the option "null" and filter to nothing. A column that
    // wants its empty case filterable spells it in the accessor instead.
    expect(
      TableFilters.facet_options(
        new Map<unknown, number>([
          [null, 2],
          ["Acme", 1],
        ]),
      ),
    ).toEqual([{ value: "Acme", label: "Acme (1)" }]);
  });

  it("is empty for a column with no faceted values, which is server mode", () => {
    expect(TableFilters.facet_options(undefined)).toEqual([]);
    expect(TableFilters.facet_options(new Map())).toEqual([]);
  });
});

describe("date ranges", () => {
  it("reads a half-open range as empty, because it filters nothing", () => {
    // Between the two clicks that make a range, the filterFn returns true for every
    // row — so a Clear button lit at that moment would be lying.
    expect(TableFilters.is_empty_value({ start: day(1), end: undefined })).toBe(
      true,
    );
  });

  it("reads a complete range as filtering", () => {
    expect(TableFilters.is_empty_value({ start: day(1), end: day(7) })).toBe(
      false,
    );
  });

  it("does not mistake some other object for a range", () => {
    expect(TableFilters.is_empty_value({ id: "x" })).toBe(false);
    expect(TableFilters.range_value({ id: "x" })).toBeUndefined();
  });

  it("passes a range through to the picker", () => {
    const range = { start: day(1), end: day(7) };

    expect(TableFilters.range_value(range)).toBe(range);
  });

  it("reports a server-side date filter as unset rather than half-working", () => {
    expect(
      TableFilters.read_param(
        CREATED,
        new URLSearchParams("createdAt=2026-08-01"),
      ),
    ).toBeUndefined();
  });

  it("writes nothing for one, so it is inert in both directions", () => {
    expect(
      TableFilters.write_param(CREATED, { start: day(1), end: day(7) }),
    ).toEqual({ createdAt: null, offset: null });
  });
});
