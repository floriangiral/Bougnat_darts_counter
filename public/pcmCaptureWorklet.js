class PcmCaptureProcessor extends AudioWorkletProcessor {
  process(inputs, outputs) {
    const inputChannel = inputs[0]?.[0];
    const outputChannel = outputs[0]?.[0];

    if (outputChannel) {
      if (inputChannel) {
        outputChannel.set(inputChannel);
      } else {
        outputChannel.fill(0);
      }
    }

    if (inputChannel && inputChannel.length > 0) {
      this.port.postMessage(inputChannel.slice());
    }

    return true;
  }
}

registerProcessor('pcm-capture-processor', PcmCaptureProcessor);
