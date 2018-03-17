
type AccountState = "OPEN" | "HELD" | "CLOSED";
type AccountEvent = "deposit" | "withdraw" | "available" | "placeHold" | "removeHold" | "close" | "reopen";

type AccountBehavior = {
  [key in AccountState]: StateBehavior
}
type StateBehavior = {
  [key in AccountEvent]: EventBehavior | null;
}
type EventBehavior = {
  nextState?: AccountState;
  predicate?: (Account) => boolean
}

const behavior: AccountBehavior = {
  OPEN: {
    deposit: {},
    withdraw: {},
    available: {},
    placeHold: { nextState: "HELD" },
    removeHold: null,
    close: { nextState: "CLOSED" },
    reopen: null
  },
  HELD: {
    deposit: {},
    withdraw: null,
    // not right, should return 0 instead of actual balance
    available: {},
    placeHold: null,
    removeHold: { nextState: "OPEN" },
    close: { nextState: "CLOSED" },
    reopen: null,
  },
  CLOSED: {
    deposit: null,
    withdraw: null,
    available: null,
    placeHold: null,
    removeHold: null,
    close: null,
    reopen: { nextState: "OPEN" }
  }
};

class Account {
  balance: number = 0;
  state: AccountState = "OPEN";

  deposit(amount: number) {
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