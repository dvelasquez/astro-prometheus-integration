// src/middleware/timing-utils.ts
function measureTTLBWithStreamWrapping(response, options) {
  const { startTime, labels, histogram } = options;
  if (response.body instanceof ReadableStream) {
    const originalBody = response.body;
    const wrappedBody = new ReadableStream({
      start(controller) {
        const reader = originalBody.getReader();
        function pump() {
          return reader.read().then((result) => {
            if (result.done) {
              const duration = (performance.now() - startTime) / 1e3;
              histogram.record(duration, labels);
              controller.close();
              return;
            }
            controller.enqueue(result.value);
            return pump();
          });
        }
        return pump();
      }
    });
    return new Response(wrappedBody, {
      status: response.status,
      statusText: response.statusText,
      headers: response.headers
    });
  }
  return response;
}
function measureTTLBWithAsyncTiming(response, options) {
  const { startTime, labels, histogram } = options;
  if (response.body instanceof ReadableStream) {
    const clonedResponse = response.clone();
    setImmediate(async () => {
      try {
        const reader = clonedResponse.body?.getReader();
        if (!reader) return;
        while (true) {
          const { done } = await reader.read();
          if (done) {
            const duration = (performance.now() - startTime) / 1e3;
            const roundedDuration = Math.round(duration * 1e3) / 1e3;
            histogram.record(roundedDuration, labels);
            break;
          }
        }
      } catch {
      }
    });
    return response;
  }
  return response;
}
export {
  measureTTLBWithAsyncTiming,
  measureTTLBWithStreamWrapping
};
//# sourceMappingURL=timing-utils.js.map