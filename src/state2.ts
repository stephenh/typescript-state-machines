
type AccountState = "OPEN" | "HELD" | "CLOSED";
type AccountTransition = "placeHold" | "removeHold" | "close" | "reopen";

type AccountBehavior = {
  [key in AccountState]: StateBehavior
}
type StateBehavior = {
  [key in AccountTransition]: { nextState?: AccountState, predicate?: (Account) => boolean } | null;
}

const behavior: AccountBehavior = {
  OPEN: {
    placeHold: { nextState: "HELD" },
    removeHold: null,
    close: null,
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

  mayDo(transition: AccountTransition): boolean {
    return behavior[this.state][transition] != null;
  }

  private transition(transition: AccountTransition): void {
    let tb = behavior[this.state][transition];
    if (tb == null || tb.nextState == null) {
      // error, not allowed
    } else {
      this.state = tb.nextState;
    }
  }

}