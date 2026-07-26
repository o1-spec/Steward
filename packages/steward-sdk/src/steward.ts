import { StewardOptions, StartRunOptions } from "./types";
import { StewardConfigError } from "./errors";
import { EventDeliveryClient } from "./delivery";
import { StewardRun } from "./run";

export class Steward {
  public readonly options: StewardOptions;
  private delivery: EventDeliveryClient;

  constructor(options: StewardOptions) {
    this.validateOptions(options);
    this.options = { ...options };
    this.delivery = new EventDeliveryClient(this.options);
  }

  private validateOptions(options: StewardOptions) {
    if (!options || typeof options !== "object") {
      throw new StewardConfigError("Steward configuration object is required");
    }

    if (!options.apiKey || typeof options.apiKey !== "string" || options.apiKey.trim() === "") {
      throw new StewardConfigError("Configuration 'apiKey' is required and cannot be empty");
    }

    if (!options.baseUrl || typeof options.baseUrl !== "string" || options.baseUrl.trim() === "") {
      throw new StewardConfigError("Configuration 'baseUrl' is required and cannot be empty");
    }

    try {
      new URL(options.baseUrl);
    } catch {
      throw new StewardConfigError(`Invalid 'baseUrl': '${options.baseUrl}' is not a valid URL`);
    }

    if (!options.agentName || typeof options.agentName !== "string" || options.agentName.trim() === "") {
      throw new StewardConfigError("Configuration 'agentName' is required and cannot be empty");
    }
  }

  public startRun(options: StartRunOptions = {}): StewardRun {
    return new StewardRun(this.delivery, this.options.agentName, options);
  }
}
