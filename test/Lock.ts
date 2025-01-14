import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { network } from "@ignored/hardhat-vnext";
import { getAddress, parseGwei } from "viem";

describe("Lock", async function () {
  const { viem, networkHelpers } = await network.connect();

  // We define a fixture to reuse the same setup in every test.
  // We use loadFixture to run this setup once, snapshot that state,
  // and reset Hardhat Network to that snapshot in every test.
  async function deployOneYearLockFixture() {
    const ONE_YEAR_IN_SECS = 365 * 24 * 60 * 60;

    const lockedAmount = parseGwei("1");
    const unlockTime = BigInt(
      (await networkHelpers.time.latest()) + ONE_YEAR_IN_SECS,
    );

    // Contracts are deployed using the first signer/account by default
    const [owner, otherAccount] = await viem.getWalletClients();

    const lock = await viem.deployContract("Lock", [unlockTime], {
      value: lockedAmount,
    });

    const publicClient = await viem.getPublicClient();

    return {
      lock,
      unlockTime,
      lockedAmount,
      owner,
      otherAccount,
      publicClient,
    };
  }

  describe("Deployment", function () {
    it("Should set the right unlockTime", async function () {
      const { lock, unlockTime } = await networkHelpers.loadFixture(
        deployOneYearLockFixture,
      );

      assert.equal(await lock.read.unlockTime(), unlockTime);
    });

    it("Should set the right owner", async function () {
      const { lock, owner } = await networkHelpers.loadFixture(
        deployOneYearLockFixture,
      );

      assert.equal(await lock.read.owner(), getAddress(owner.account.address));
    });

    it("Should receive and store the funds to lock", async function () {
      const { lock, lockedAmount, publicClient } =
        await networkHelpers.loadFixture(deployOneYearLockFixture);

      assert.equal(
        await publicClient.getBalance({
          address: lock.address,
        }),
        lockedAmount,
      );
    });

    it("Should fail if the unlockTime is not in the future", async function () {
      // We don't use the fixture here because we want a different deployment
      const latestTime = BigInt(await networkHelpers.time.latest());
      await assert.rejects(
        viem.deployContract("Lock", [latestTime], {
          value: 1n,
        }),
        (error: Error) =>
          error.message.includes("Unlock time should be in the future"),
      );
    });
  });

  describe("Withdrawals", function () {
    describe("Validations", function () {
      it("Should revert with the right error if called too soon", async function () {
        const { lock } = await networkHelpers.loadFixture(
          deployOneYearLockFixture,
        );

        await assert.rejects(lock.write.withdraw(), (error: Error) =>
          error.message.includes("You can't withdraw yet"),
        );
      });

      it("Should revert with the right error if called from another account", async function () {
        const { lock, unlockTime, otherAccount } =
          await networkHelpers.loadFixture(deployOneYearLockFixture);

        // We can increase the time in Hardhat Network
        await networkHelpers.time.increaseTo(unlockTime);

        // We retrieve the contract with a different account to send a transaction
        const lockAsOtherAccount = await viem.getContractAt(
          "Lock",
          lock.address,
          { client: { wallet: otherAccount } },
        );
        await assert.rejects(
          lockAsOtherAccount.write.withdraw(),
          (error: Error) => error.message.includes("You aren't the owner"),
        );
      });

      it("Shouldn't fail if the unlockTime has arrived and the owner calls it", async function () {
        const { lock, unlockTime } = await networkHelpers.loadFixture(
          deployOneYearLockFixture,
        );

        // Transactions are sent using the first signer by default
        await networkHelpers.time.increaseTo(unlockTime);

        await assert.doesNotReject(lock.write.withdraw());
      });
    });

    describe("Events", function () {
      it("Should emit an event on withdrawals", async function () {
        const { lock, unlockTime, lockedAmount, publicClient } =
          await networkHelpers.loadFixture(deployOneYearLockFixture);

        await networkHelpers.time.increaseTo(unlockTime);

        const hash = await lock.write.withdraw();
        await publicClient.waitForTransactionReceipt({ hash });

        // get the withdrawal events in the latest block
        const withdrawalEvents = await lock.getEvents.Withdrawal();
        assert.equal(withdrawalEvents.length, 1);
        assert.equal(withdrawalEvents[0].args.amount, lockedAmount);
      });
    });
  });
});
