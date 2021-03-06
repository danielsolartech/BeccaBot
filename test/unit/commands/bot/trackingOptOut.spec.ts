import { expect } from "chai";
import { createSandbox, SinonStub } from "sinon";
import { Message } from "discord.js";
import * as TOO from "@Models/TrackingOptOutModel";
import * as TrackingList from "@Utils/commands/trackingList";
import { mock } from "ts-mockito";
import { ImportMock, MockManager } from "ts-mock-imports";
import {
  removeCallback,
  MESSAGE_COMMAND_INVALID,
  MESSAGE_SUBCOMMAND_INVALID,
  addCallBack,
  trackingOptOut,
} from "@Commands/bot/trackingOptOut";
import { buildMessageInt } from "../../../testSetup";

describe("command opt-out", () => {
  let sandbox = createSandbox();
  let TrackingOptOutDocumentMock;
  let TrackingOptOutMock: MockManager<TOO.TrackingOptOutInt>;
  let isTrackableUser: SinonStub;
  let trackUser: SinonStub;
  let deleteMany: SinonStub;
  const userRec = {
    user_id: "123456789",
  };

  beforeEach(() => {
    sandbox = createSandbox();
    trackUser = sandbox.stub();

    isTrackableUser = sandbox.stub();
    isTrackableUser.returns(false);

    deleteMany = sandbox.stub();
    deleteMany.resolves();

    sandbox.replace(TrackingList, "trackUser", trackUser);
    sandbox.replace(TrackingList, "isTrackableUser", isTrackableUser);
    sandbox.replace(TOO.TrackingOptOut, "deleteMany", deleteMany);
    TrackingOptOutDocumentMock = mock<TOO.TrackingOptOutInt>();
    TrackingOptOutMock = ImportMock.mockFunction(
      TOO,
      "TrackingOptOut",
      TrackingOptOutDocumentMock
    );
  });

  afterEach(() => {
    ImportMock.restore();
    sandbox.restore();
  });

  context("when command invalid", () => {
    it("return error message", async () => {
      const testMessage = buildMessageInt("|outOut add", "123456789", "author");
      testMessage.channel.send = sandbox.stub();

      await trackingOptOut.run(testMessage);

      expect(testMessage.channel.send).calledOnceWith(MESSAGE_COMMAND_INVALID);
    });
  });

  context("when subcommand invalid", () => {
    it("return error message", async () => {
      const testMessage = buildMessageInt(
        "|optout",
        "123456789",
        "author"
      );
      testMessage.channel.send = sandbox.stub();

      await trackingOptOut.run(testMessage);

      expect(testMessage.channel.send).calledOnceWith(
        MESSAGE_SUBCOMMAND_INVALID
      );
    });
  });

  context("when subcommand valid", () => {
    describe("command: !optout add", () => {
      context("user already exists", () => {
        it("invoke call back without actually adding", async () => {
          const testMessage = buildMessageInt(
            "   |optout                  add   ",
            "123456789",
            "author"
          );
          testMessage.channel.send = sandbox.stub();
          isTrackableUser.returns(false);

          await trackingOptOut.run(testMessage);

          expect(TrackingOptOutMock).not.called;
          expect(testMessage.channel.send).calledWith(
            `<@123456789> is currently opted-out`
          );
        });
      });
      context("user does not exist", () => {
        it("attempt to add user id to database", async () => {
          const testMessage = buildMessageInt(
            "   |optout                  add   ",
            "123456789",
            "author"
          );
          isTrackableUser.returns(true);

          await trackingOptOut.run(testMessage);

          expect(TrackingOptOutMock).calledOnceWith({
            user_id: "123456789",
          });
        });
      });
      describe("addCallBack called", () => {
        it("should notify user they are now opt-out", async () => {
          const testMessage = buildMessageInt(
            "|optout add",
            "123456789",
            "author"
          );
          testMessage.channel.send = sandbox.stub();
          const document: TOO.TrackingOptOutInt = {
            user_id: "123456789",
          } as TOO.TrackingOptOutInt;
          await addCallBack(testMessage, "123456789")(null, document);

          expect(trackUser).calledWith("123456789", false);
          expect(testMessage.channel.send).calledWith(
            `<@123456789>, you are now opt-out of tracking.`
          );
        });
        it("should notify user if opt-out failed", async () => {
          const testMessage = buildMessageInt(
            "|optout add",
            "123456789",
            "author"
          );
          testMessage.channel.send = sandbox.stub();
          try {
            await addCallBack(testMessage, "123456789")(
              new Error("Something"),
              null
            );
          } catch (error) {
            expect(trackUser).not.called;
            expect(testMessage.channel.send).calledWith(
              `Oops, <@123456789>, something went wrong. Please try again in a few minutes.`
            );
          }
        });
      });
    });
    describe("command: !optout remove", () => {
      it("call deleteMany to remove records", async () => {
        const testMessage = buildMessageInt(
          "   |optout remove   ",
          "123456789",
          "author"
        );
        isTrackableUser.returns(false);
        deleteMany.resolves();

        await trackingOptOut.run(testMessage);

        expect(TOO.TrackingOptOut.deleteMany).called;
        expect(deleteMany).calledWith({
          user_id: "123456789",
        });
      });
      describe("removeCallBack called", () => {
        it("warn user if error occured", async () => {
          const testMessage = buildMessageInt(
            "   |optout remove   ",
            "123456789",
            "author"
          );
          testMessage.channel.send = sandbox.stub();

          await removeCallback(testMessage)(new Error());

          expect(testMessage.channel.send).calledWith(
            `Oops, <@123456789>, something went wrong. Please try again in a few minutes.`
          );
        });
        it("notify user of status change", async () => {
          const testMessage = buildMessageInt(
            "   |optout remove   ",
            "123456789",
            "author"
          );
          testMessage.channel.send = sandbox.stub();

          await removeCallback(testMessage)(null);

          expect(trackUser).calledWith("123456789", true);
          expect(testMessage.channel.send).calledWith(
            `<@123456789>, you are now opted into tracking.`
          );
        });
      });
    });
    describe("command: !optout status", () => {
      context("user not found", () => {
        it("call find to recieve records", async () => {
          const testMessage = buildMessageInt(
            "   |optout status   ",
            "123456789",
            "author"
          );
          isTrackableUser.returns(true);

          await trackingOptOut.run(testMessage);

          expect(TOO.TrackingOptOut.deleteMany).not.calledWith(userRec);
        });
        it("notify user they are opt-in", async () => {
          const testMessage = buildMessageInt(
            "   |optout status   ",
            "123456789",
            "author"
          );
          isTrackableUser.returns(true);
          testMessage.channel.send = sandbox.stub();

          await trackingOptOut.run(testMessage);

          expect(testMessage.channel.send).calledWith(
            `<@123456789> is currently opted-in`
          );
        });
      });
      context("user found", () => {
        it("notify user they are opt-out", async () => {
          const testMessage = buildMessageInt(
            "   |optout status   ",
            "123456789",
            "author"
          );
          testMessage.channel.send = sandbox.stub();
          isTrackableUser.returns(false);

          await trackingOptOut.run(testMessage);

          expect(testMessage.channel.send).calledWith(
            `<@123456789> is currently opted-out`
          );
        });
      });
    });
  });
});
