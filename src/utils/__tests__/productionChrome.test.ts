import { describe, it, expect } from "bun:test";
import {
  PRODUCTION_MENU_A11Y_ANDROID,
  PRODUCTION_MENU_A11Y_IOS,
} from "../productionChrome";

describe("production menu a11y", () => {
  it("keeps iOS on More options", () => {
    expect(PRODUCTION_MENU_A11Y_IOS).toBe("More options");
  });

  it("does not share Android Dev Client overflow label", () => {
    expect(PRODUCTION_MENU_A11Y_ANDROID).toBe("Configuration options");
    expect(PRODUCTION_MENU_A11Y_ANDROID).not.toBe(PRODUCTION_MENU_A11Y_IOS);
    expect(PRODUCTION_MENU_A11Y_ANDROID).not.toBe("More options");
  });
});
