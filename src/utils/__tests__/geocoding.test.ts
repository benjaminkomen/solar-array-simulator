import { describe, it, expect, mock, beforeEach } from "bun:test";
import { searchCity } from "../geocoding";

// Mock global fetch
const mockFetch = mock(() => Promise.resolve(new Response("[]")));

beforeEach(() => {
  // @ts-expect-error - replacing global fetch with mock
  globalThis.fetch = mockFetch;
  mockFetch.mockReset();
});

describe("searchCity", () => {
  it("returns empty array for short queries", async () => {
    const results = await searchCity("a");
    expect(results).toEqual([]);
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("returns empty array for whitespace-only query", async () => {
    const results = await searchCity("  ");
    expect(results).toEqual([]);
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("maps Nominatim response to GeocodingResult", async () => {
    const nominatimResponse = [
      {
        display_name: "Amsterdam, Noord-Holland, Netherlands",
        lat: "52.3676",
        lon: "4.9041",
        type: "city",
        class: "place",
      },
    ];

    mockFetch.mockImplementationOnce(() =>
      Promise.resolve(new Response(JSON.stringify(nominatimResponse)))
    );

    const results = await searchCity("Amsterdam");
    expect(results).toHaveLength(1);
    expect(results[0].displayName).toBe("Amsterdam, Noord-Holland, Netherlands");
    expect(results[0].latitude).toBeCloseTo(52.3676);
    expect(results[0].longitude).toBeCloseTo(4.9041);
  });

  it("sends correct URL parameters", async () => {
    mockFetch.mockImplementationOnce(() =>
      Promise.resolve(new Response("[]"))
    );

    await searchCity("Berlin");

    expect(mockFetch).toHaveBeenCalledTimes(1);
    const url = mockFetch.mock.calls[0][0] as string;
    expect(url).toContain("q=Berlin");
    expect(url).toContain("format=json");
    expect(url).toContain("limit=5");
  });

  it("includes User-Agent header", async () => {
    mockFetch.mockImplementationOnce(() =>
      Promise.resolve(new Response("[]"))
    );

    await searchCity("Tokyo");

    const options = mockFetch.mock.calls[0][1] as RequestInit;
    expect(options.headers).toBeDefined();
    const headers = options.headers as Record<string, string>;
    expect(headers["User-Agent"]).toBe("SolarArrayLayoutApp/1.0");
  });

  it("throws on non-OK response", async () => {
    mockFetch.mockImplementationOnce(() =>
      Promise.resolve(new Response("Server Error", { status: 500 }))
    );

    expect(searchCity("Paris")).rejects.toThrow("Geocoding failed: 500");
  });

  it("handles multiple results", async () => {
    const nominatimResponse = [
      { display_name: "City A", lat: "10", lon: "20", type: "city", class: "place" },
      { display_name: "City B", lat: "30", lon: "40", type: "city", class: "place" },
      { display_name: "City C", lat: "50", lon: "60", type: "city", class: "place" },
    ];

    mockFetch.mockImplementationOnce(() =>
      Promise.resolve(new Response(JSON.stringify(nominatimResponse)))
    );

    const results = await searchCity("City");
    expect(results).toHaveLength(3);
    expect(results[0].latitude).toBe(10);
    expect(results[2].longitude).toBe(60);
  });
});
