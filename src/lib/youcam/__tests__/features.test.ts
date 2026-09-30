import { describe, expect, it } from "vitest";
import { FEATURES, featuresFor, mergeMeasurements, unitsFor } from "../features";

// Result shapes copied from the documented response schemas.
describe("YouCam result normalizers", () => {
  it("hair type", () => {
    expect(FEATURES["hair-type"].normalize({ hair_type: { mapping: "4a to 4b", term: "Kinky Soft to Coily" } })).toEqual({
      type: { kind: "type", index: 7, mapping: "4a to 4b", term: "Kinky Soft to Coily", family: "coily" },
    });
  });
  it("hair type as the live API actually returns it (upper-case)", () => {
    expect(FEATURES["hair-type"].normalize({ hair_type: { mapping: "4B to 4C", term: "Coily to Extremely Coily" } })?.type?.index).toBe(8);
  });
  it("hair density", () => {
    expect(FEATURES["hair-density"].normalize({ timed: 0.4, hair_density: { mapping: "2.16", term: "High Density" } }))
      .toEqual({ density: { kind: "density", grade: 3, value: 2.16, term: "High Density" } });
  });
  it("hair length", () => {
    expect(FEATURES["hair-length"].normalize({ hair_length: { term: "above chest or longer" } })?.length)
      .toMatchObject({ tier: "chest", openEnded: true });
  });
  it("hair frizz", () => {
    expect(FEATURES["hair-frizz"].normalize({ hair_frizziness: { mapping: 1, term: "Slightly Frizzy" } })?.frizz?.grade).toBe(1);
  });
  it("hair colour from skin-tone analysis", () => {
    expect(FEATURES["hair-color"].normalize({ color: { hair_color: "2B1D14", hair_color_name: "Brown" } }))
      .toEqual({ color: { kind: "color", hex: "#2B1D14" } });
  });
  it("returns undefined for unexpected shapes instead of guessing", () => {
    expect(FEATURES["hair-type"].normalize({ hair_type: { mapping: "blue" } })).toBeUndefined();
    expect(FEATURES["hair-density"].normalize(null)).toBeUndefined();
    expect(FEATURES["hair-color"].normalize({ color: { hair_color: "red" } })).toBeUndefined();
  });
  it("request bodies follow each endpoint's documented capture protocol", () => {
    expect(FEATURES["hair-type"].views).toEqual(["front", "right", "left"]);
    expect(FEATURES["hair-frizz"].views).toEqual(["front", "right", "left"]);
    expect(FEATURES["hair-density"].views).toEqual(["down"]);
    expect(FEATURES["hair-length"].views).toEqual(["front"]);
    expect(FEATURES["hair-type"].body(["f", "r", "l"])).toEqual({ src_file_ids: ["f", "r", "l"] });
    expect(FEATURES["hair-density"].body(["d"])).toEqual({ src_file_id: "d" });
  });
  it("costs and merging", () => {
    const f = featuresFor(["type", "density", "length", "frizz"]);
    expect(unitsFor(f)).toBe(7);
    expect(Object.keys(mergeMeasurements([{ density: undefined }, undefined, { frizz: { kind: "frizz", grade: 0, term: "Not Frizzy" } }]))).toContain("frizz");
  });
});
