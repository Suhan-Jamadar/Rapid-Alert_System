import { describe, it, expect } from "vitest";
import { classifyTweet, generateTweet, createAlert, generateProcessingLogs } from "../lib/simulation-data";

describe("example", () => {
  it("should pass", () => {
    expect(true).toBe(true);
  });
});

describe("location matching", () => {
  it("should correct misspelled city names", () => {
    const classification = { type: 'fire' as const, priority: 'HIGH' as const };
    const alert = createAlert("test-id", "image", "Hoskote-Dabaspet National Highway, Banglore", "Car accident on highway", classification);
    expect(alert).not.toBeNull();
    expect(alert!.coordinates.lat).toBeCloseTo(12.97, 1); // Bangalore latitude
    expect(alert!.coordinates.lng).toBeCloseTo(77.59, 1); // Bangalore longitude
  });

  it("should handle exact location matches", () => {
    const classification = { type: 'fire' as const, priority: 'HIGH' as const };
    const alert = createAlert("test-id", "manual_report", "Silk Board Junction, Bangalore", "Fire reported", classification);
    expect(alert).not.toBeNull();
    expect(alert!.coordinates.lat).toBe(12.9352);
    expect(alert!.coordinates.lng).toBe(77.6245);
  });
});

describe("random tweets", () => {
  it("should classify random tweets as ignored", () => {
    const randomTweet = {
      id: "test-random",
      text: "Just had the best coffee ever! ☕ #morningvibes",
      author: "@test",
      timestamp: new Date(),
      location: "Test City",
      isRandom: true
    };

    const classification = classifyTweet(randomTweet);
    expect(classification.shouldIgnore).toBe(true);
    expect(classification.priority).toBe('LOW');
  });

  it("should not create alerts for ignored tweets", () => {
    const classification = { type: 'rescue' as const, priority: 'LOW' as const, shouldIgnore: true };
    const alert = createAlert("test-id", "tweet", "Test Location", "Random tweet content", classification);
    expect(alert).toBeNull();
  });

  it("should generate only edge filter logs for ignored tweets", () => {
    const classification = { type: 'rescue' as const, priority: 'LOW' as const, shouldIgnore: true };
    const logs = generateProcessingLogs("test-id", "tweet", "Random tweet content", classification, "Test Location");
    expect(logs.length).toBe(1);
    expect(logs[0].stage).toBe('edge_filter');
    expect(logs[0].result).toContain('Filtered out');
  });

  it("should generate emergency tweets without isRandom flag", () => {
    const tweet = generateTweet();
    // This might be random or emergency, but if it's emergency, isRandom should be false
    if (tweet.isRandom === false) {
      const classification = classifyTweet(tweet);
      expect(classification.shouldIgnore).toBeUndefined();
    }
  });
});
