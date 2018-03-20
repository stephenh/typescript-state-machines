
namespace state3 {
  // To allow our DSL to override behavior without being repetitive
  // (e.g. re-defining the `deposit` implementation in multiple states),
  // we pull our default implementations out into a stateless "business
  // logic" class.
  //
  // This is somewhat odd, removing behavior from the object, but we're
  // doing this explicitly because the logic was (in a less trivial app)
  // becoming too complicated to live within a single object/method.
  //
  // This is stateless so that we can define override behavior once within
  // our config DSL (see below) and have it apply to multiple account instances.
  class DefaultEventLogic {
    deposit(account: Account, amount: number) {
      account.balance += amount;
    }

    withdraw(account: Account, amount: number) {
      account.balance -= amount;
    }

    available(account: Account): number {
      return account.balance;
    }

    // these events don't have any logic, as they are purely transition,
    // but we define them here anyway so that they automatically become
    // part of our AccountEvent type
    placeHold() {
    }

    removeHold() {
    }

    close() {
    }

    reopen() {
    }
  }

  // same basic states as before
  type AccountState = "OPEN" | "HELD" | "CLOSED";
  // instead of re-typing the constants `deposit | withdraw | ...`,
  // we can copy them out of our logic class
  type AccountEvent = keyof DefaultEventLogic;

  // same trio of Account/State/Event spec behavior
  type AccountBehavior = {
    [key in AccountState]: StateBehavior
  }
  type StateBehavior = {
    [key in AccountEvent]?: EventBehavior;
  }
  type EventBehavior = {
    nextState?: AccountState,
    override?: DefaultEventLogic;
  }

  // and now the actual config DSL
  const behavior: AccountBehavior = {
    OPEN: {
      // same as previous, deposit is a valid operation
      // in the OPEN state, but is not a transition
      deposit: {},
      withdraw: {},
      available: {},
      placeHold: { nextState: "HELD" },
      close: { nextState: "CLOSED" },
    },
    HELD: {
      deposit: {},
      available: {
        // now we can override the `available` method specific to
        // our HELD state. oddly, there is no override keyword in TS,
        // so the signature of `available` is not technically type
        // checked against the base class. See TypeScript issue #2000.
        override: new class extends DefaultEventLogic {
          available(account: Account) { return 0; }
        }
      },
      removeHold: { nextState: "OPEN" },
      close: { nextState: "CLOSED" },
    },
    CLOSED: {
      reopen: { nextState: "OPEN" }
    }
  };

  class Account {
    balance: number = 0;
    state: AccountState = "OPEN";

    deposit(amount: number) {
      // we have a perform method, just as before, but now instead always
      // call the business logic within the EventLogic class, which will
      // either be the default behavior, or the state-specific overridden
      // behavior
      this.perform("deposit", l => l.deposit(this, amount));
    }

    withdraw(amount: number) {
      this.perform("withdraw", l => l.withdraw(this, amount));
    }

    available(): number {
      return this.perform("available", l => l.available(this));
    }

    placeHold() {
      this.perform("placeHold", l => l.placeHold());
    }

    removeHold() {
      this.perform("removeHold", l => l.removeHold());
    }

    mayDo(event: AccountEvent): boolean {
      return behavior[this.state][event] != null;
    }

    private perform<T>(event: AccountEvent, callback: (e: DefaultEventLogic) => T): T {
      if (!this.mayDo(event)) {
        // not allowed, throw error
      }
      let logic = this.getLogic(event);
      let value = callback(logic);
      this.transitionIfNeeded(event);
      return value;
    }

    private transitionIfNeeded(event: AccountEvent): void {
      let eb = behavior[this.state][event];
      if (eb == null || eb.nextState == null) {
        // error, not allowed
      } else {
        this.state = eb.nextState;
      }
    }

    private getLogic(event: AccountEvent): DefaultEventLogic {
      let eb = behavior[this.state][event];
      return (eb && eb.override) ? eb.override : new DefaultEventLogic();
    }
  }
}