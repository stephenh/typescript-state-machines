
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

  placeHold() {
  }

  removeHold() {
  }

  close() {
  }

  reopen() {
  }
}

type AccountState = "OPEN" | "HELD" | "CLOSED";
type AccountEvent = keyof DefaultEventLogic;

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

const behavior: AccountBehavior = {
  OPEN: {
    deposit: {},
    withdraw: {},
    available: {},
    placeHold: { nextState: "HELD" },
    close: { nextState: "CLOSED" },
  },
  HELD: {
    deposit: {},
    available: {
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