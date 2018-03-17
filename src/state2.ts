
type AccountState = "OPEN" | "HELD" | "CLOSED";
type AccountEvent = "placeHold" | "removeHold" | "close" | "reopen";

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
    placeHold: { nextState: "HELD" },
    removeHold: null,
    close: { nextState: "CLOSED" },
    reopen: null
  },
  HELD: {
    placeHold: null,
    removeHold: { nextState: "OPEN" },
    close: { nextState: "CLOSED" },
    reopen: null,
  },
  CLOSED: {
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
    this.balance += amount;
  }

  withdraw(amount: number) {
    this.balance -= amount;
  }

  available() {
    return this.balance;
  }

  placeHold() {
    this.transition("placeHold")
  }

  removeHold() {
    this.transition("removeHold")
  }

  mayDo(event: AccountEvent): boolean {
    return behavior[this.state][event] != null;
  }

  private transition(event: AccountEvent): void {
    let tb = behavior[this.state][event];
    if (tb == null || tb.nextState == null) {
      // error, not allowed
    } else {
      this.state = tb.nextState;
    }
  }

}