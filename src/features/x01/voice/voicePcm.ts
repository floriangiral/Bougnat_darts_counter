export function downsampleToLinear16(input: Float32Array, inputSampleRate: number, outputSampleRate: number): Int16Array {
  if (inputSampleRate === outputSampleRate) {
    return floatTo16BitPCM(input);
  }

  const sampleRateRatio = inputSampleRate / outputSampleRate;
  const newLength = Math.max(1, Math.round(input.length / sampleRateRatio));
  const output = new Float32Array(newLength);

  let outputIndex = 0;
  let inputIndex = 0;

  while (outputIndex < newLength) {
    const nextInputIndex = Math.round((outputIndex + 1) * sampleRateRatio);
    let sum = 0;
    let count = 0;

    for (let i = inputIndex; i < nextInputIndex && i < input.length; i += 1) {
      sum += input[i];
      count += 1;
    }

    output[outputIndex] = count > 0 ? sum / count : 0;
    outputIndex += 1;
    inputIndex = nextInputIndex;
  }

  return floatTo16BitPCM(output);
}

export function floatTo16BitPCM(input: Float32Array): Int16Array {
  const output = new Int16Array(input.length);

  for (let i = 0; i < input.length; i += 1) {
    const sample = Math.max(-1, Math.min(1, input[i]));
    output[i] = sample < 0 ? sample * 0x8000 : sample * 0x7fff;
  }

  return output;
}
