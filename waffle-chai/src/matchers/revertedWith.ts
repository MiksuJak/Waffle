export function supportRevertedWith(Assertion: Chai.AssertionStatic) {
  Assertion.addMethod('revertedWith', function (this: any, revertReason: string) {
    const promise = this._obj;

    const onSuccess = (value: any) => {
      this.assert(
        false,
        'Expected transaction to be reverted',
        'Expected transaction NOT to be reverted',
        'Transaction reverted.',
        'Transaction NOT reverted.'
      );
      return value;
    };

    const onError = (error: any) => {
      // See https://github.com/ethers-io/ethers.js/issues/829
      const isEstimateGasError =
        error instanceof Object &&
        error.code === 'UNPREDICTABLE_GAS_LIMIT' &&
        'error' in error;

      if (isEstimateGasError) {
        error = error.error;
      }

      const reasonsList = error.results && Object.values(error.results).map((o: any) => o.reason);
      const message = (error instanceof Object && 'message' in error) ? error.message : JSON.stringify(error);
      const isReverted = reasonsList
        ? reasonsList.some((r: string) => r === revertReason)
        : message.includes('revert') && message.includes(revertReason);
      const isThrown = message.search('invalid opcode') >= 0 && revertReason === '';

      this.assert(
        isReverted || isThrown,
        `Expected transaction to be reverted with ${revertReason}, but other exception was thrown: ${error}`,
        `Expected transaction NOT to be reverted with ${revertReason}`,
        `Transaction reverted with ${revertReason}.`,
        error
      );
      return error;
    };

    const derivedPromise = promise.then(onSuccess, onError);
    this.then = derivedPromise.then.bind(derivedPromise);
    this.catch = derivedPromise.catch.bind(derivedPromise);
    return this;
  });
}
