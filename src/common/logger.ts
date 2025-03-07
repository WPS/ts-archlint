export class Logger {
  private static verbose: boolean = false

  static setVerbose(verbose: boolean) {
    Logger.verbose = verbose

    if (verbose) {
      Logger.log('Logger is set to verbose')
    }
  }

  static info(message: string, ...params: any[]): void {
    this.log(message, ...params)
  }

  static debug(message: string, ...params: any[]): void {
    if (Logger.verbose) {
      this.log(message, ...params)
    }
  }

  private static log(message: string, ...params: any[]): void {
    let paramsString = ''
    if (params.length > 0) {
      paramsString = JSON.stringify(params)
    }

    console.log(`${message} ${paramsString}`)
  }
}