const { test } = require("@playwright/test");
const { WidgetPage } = require("../pages/widget-page");
const { SttPage } = require("../pages/stt-page");

test.describe("STT module", () => {
  test("prerecorded podcast renders transcript lines in order", async ({
    page,
  }) => {
    test.setTimeout(120_000);
    const widgetPage = new WidgetPage(page);
    const sttPage = new SttPage(page);

    await widgetPage.goto();
    await widgetPage.openModule("Speech To Text");

    await sttPage.selectPrerecordedOption("Podcast");
    await sttPage.play();
    await sttPage.waitForPlaybackToStart();
    await sttPage.waitForTranscriptReady(120_000);

    await sttPage.waitForTranscriptLine({
      speakerText: "Speaker 1",
      timeText: ":00",
      contentText: "Being a creator is an",
      speakerIndex: 0,
    });
    await sttPage.waitForTranscriptLine({
      speakerText: "Speaker 2",
      timeText: ":06",
      contentText: "I usually try to keep one",
      speakerIndex: 0,
    });
    await sttPage.waitForTranscriptLine({
      speakerText: "Speaker 3",
      timeText: ":14",
      contentText: "Yes, and I do office hours on",
      speakerIndex: 0,
    });
    await sttPage.waitForTranscriptLine({
      speakerText: "Speaker 2",
      timeText: ":23",
      contentText: "I am curious, how do you",
      speakerIndex: 1,
    });
    await sttPage.waitForTranscriptLine({
      speakerText: "Speaker 1",
      timeText: ":26",
      contentText: "Hmm, Interesting question.",
      speakerIndex: 1,
    });
    await sttPage.waitForTranscriptLine({
      speakerText: "Speaker 3",
      timeText: ":28",
      contentText: "Well, usually I lower the bar",
      speakerIndex: 1,
    });
    await sttPage.waitForTranscriptLine({
      speakerText: "Speaker 2",
      timeText: ":40",
      contentText: "Oh yes, I keep a parking lot",
      speakerIndex: 2,
    });
    await sttPage.waitForTranscriptLine({
      speakerText: "Speaker 1",
      timeText: ":47",
      contentText: "That's really great. So one",
      speakerIndex: 2,
    });
    await sttPage.waitForTranscriptLine({
      speakerText: "Speaker 2",
      timeText: ":52",
      contentText: "Be useful to one person, then",
      speakerIndex: 3,
    });
    await sttPage.waitForTranscriptLine({
      speakerText: "Speaker 3",
      timeText: ":56",
      contentText: "Hmm... Make it fun and the",
      speakerIndex: 2,
    });
    await sttPage.waitForTranscriptLine({
      speakerText: "Speaker 1",
      timeText: "1:00",
      contentText: "Alright. I think theme set,",
      speakerIndex: 3,
    });
    await sttPage.waitForTranscriptLine({
      speakerText: "Speaker 2",
      timeText: ":05",
      contentText: "Yes!",
      speakerIndex: 4,
    });

    await sttPage.assertCopyAvailable();
    await sttPage.copyConversation();
  });
});
