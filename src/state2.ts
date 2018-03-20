
namespace state2 {
  // define our states
  type AccountState = "OPEN" | "HELD" | "CLOSED";
  // and events (some events lead to transitions, e.g. placeHold,
  // others do not, e.g. deposit)
  type AccountEvent = "deposit" | "withdraw" | "available" | "placeHold" | "removeHold" | "close" | "reopen";

  // define the shape of our config DSL
  type AccountBehavior = {
    // every state must have it's behavior specified
    [key in AccountState]: StateBehavior
  }
  type StateBehavior = {
    // for a given state, we may have an event defined; if
    // there is no event, that means it's not a valid operation
    // or transition in the current state, and will be rejected
    [key in AccountEvent]?: EventBehavior;
  }
  type EventBehavior = {
    // optionally defines the next state to transition to
    nextState?: AccountState;
  }

  // now define our actual behavior, to match the types above
  const behavior: AccountBehavior = {
    OPEN: {
      // since deposit is defined, it is a valid event within
      // the OPEN state. the empty hash means we don't have
      // a nextState to transition to next, so will stay in OPEN
      deposit: {},
      withdraw: {},
      available: {},
      placeHold: { nextState: "HELD" },
      close: { nextState: "CLOSED" },
    },
    HELD: {
      deposit: {},
      // in theory we'd like to disable/override the behavior of
      // available within the HELD state; our current DSL can't
      // support that
      available: {},
      removeHold: { nextState: "OPEN" },
      close: { nextState: "CLOSED" },
    },
    CLOSED: {
      reopen: { nextState: "OPEN" }
    }
  };

  // now a pretty basic class with state/operations
  class Account {

    balance: number = 0;
    state: AccountState = "OPEN";

    deposit(amount: number) {
      // each of our events goes through the "perform" method, which
      // ensures: a) that event may be validly executed in the current
      // state, and b) transitions us to the next state if needed
      this.perform("deposit", () => this.balance += amount);
    }

    withdraw(amount: number) {
      this.perform("withdraw", () => this.balance -= amount);
    }

    available(): number {
      return this.perform("available", () => this.balance);
    }

    placeHold() {
      this.perform("placeHold", () => null);
    }

    removeHold() {
      this.perform("removeHold", () => null);
    }

    // allows clients to ask if a given event is allowed in our current state
    mayDo(event: AccountEvent): boolean {
      return behavior[this.state][event] != null;
    }

    private perform<T>(event: AccountEvent, logic: () => T): T {
      if (!this.mayDo(event)) {
        // not allowed, throw error
      }
      let value = logic();
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
  }
}