import { describe, expect, it } from "vitest";
import { findTakeovers, importAccess, type Access } from "./access";

describe("importAccess", () => {
  it("örnek sorular sahipsiz ve herkese açık aktarılır", () => {
    expect(importAccess({ isExample: true, ownerId: null })).toEqual({ ownerId: null, isPublic: true });
  });

  it("gerçek sorular sahibine ait ve gizli aktarılır", () => {
    expect(importAccess({ isExample: false, ownerId: "u1" })).toEqual({ ownerId: "u1", isPublic: false });
  });

  it("gerçek sorular sahip belirtmeden aktarılamaz", () => {
    expect(() => importAccess({ isExample: false, ownerId: null })).toThrow(/--sahip/);
  });

  it("örnek sorulara sahip verilemez (misafirler görememesin diye)", () => {
    expect(() => importAccess({ isExample: true, ownerId: "u1" })).toThrow(/herkese açık/);
  });
});

describe("findTakeovers", () => {
  const A: Access = { ownerId: "a", isPublic: false };
  const B: Access = { ownerId: "b", isPublic: false };
  const PUBLIC: Access = { ownerId: null, isPublic: true };
  const LEGACY: Access = { ownerId: null, isPublic: false }; // migration öncesi aktarılmış satır

  it("başka hesabın sorusu devralınamaz", () => {
    expect(findTakeovers(new Map([["q1", A]]), ["q1"], B)).toEqual(["q1"]);
  });

  it("herkese açık örnek soru bir hesaba geçirilemez", () => {
    expect(findTakeovers(new Map([["q1", PUBLIC]]), ["q1"], A)).toEqual(["q1"]);
  });

  it("bir hesabın sorusu herkese açılamaz", () => {
    expect(findTakeovers(new Map([["q1", A]]), ["q1"], PUBLIC)).toEqual(["q1"]);
  });

  it("aynı sahibin tekrar aktarımı serbest", () => {
    expect(findTakeovers(new Map([["q1", A]]), ["q1"], A)).toEqual([]);
    expect(findTakeovers(new Map([["q1", PUBLIC]]), ["q1"], PUBLIC)).toEqual([]);
  });

  it("migration öncesi sahipsiz satırlar sahiplenilebilir", () => {
    expect(findTakeovers(new Map([["q1", LEGACY]]), ["q1"], A)).toEqual([]);
    expect(findTakeovers(new Map([["q1", LEGACY]]), ["q1"], PUBLIC)).toEqual([]);
  });

  it("yeni sorular çakışma sayılmaz; yalnızca çakışanlar döner", () => {
    expect(findTakeovers(new Map([["q1", A], ["q2", B]]), ["q1", "q2", "q3"], B)).toEqual(["q1"]);
  });
});
