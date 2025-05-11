(function(window){
  var WORKER_PATH = URL.createObjectURL(new Blob([`
  var recLength = 0, recBuffers = [], sampleRate;

  self.onmessage = function(e){
    switch(e.data.command){
      case 'init': init(e.data.config); break;
      case 'record': record(e.data.buffer); break;
      case 'exportWAV': exportWAV(e.data.type); break;
      case 'clear': clear(); break;
    }
  };

  function init(config){ sampleRate = config.sampleRate; }
  function record(inputBuffer){
    recBuffers.push(inputBuffer[0]);
    recLength += inputBuffer[0].length;
  }
  function exportWAV(type){
    var buffer = mergeBuffers(recBuffers, recLength);
    var dataview = encodeWAV(buffer);
    var audioBlob = new Blob([dataview], { type: type });
    self.postMessage(audioBlob);
  }
  function clear(){ recLength = 0; recBuffers = []; }
  function mergeBuffers(recBuffers, recLength){
    var result = new Float32Array(recLength);
    var offset = 0;
    for (var i = 0; i < recBuffers.length; i++){
      result.set(recBuffers[i], offset);
      offset += recBuffers[i].length;
    }
    return result;
  }
  function floatTo16BitPCM(output, offset, input){
    for (var i = 0; i < input.length; i++, offset+=2){
      var s = Math.max(-1, Math.min(1, input[i]));
      output.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
    }
  }
  function writeString(view, offset, string){
    for (var i = 0; i < string.length; i++){
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  }
  function encodeWAV(samples){
    var buffer = new ArrayBuffer(44 + samples.length * 2);
    var view = new DataView(buffer);
    writeString(view, 0, 'RIFF');
    view.setUint32(4, 36 + samples.length * 2, true);
    writeString(view, 8, 'WAVE');
    writeString(view, 12, 'fmt ');

    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, 1, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * 2, true);
    view.setUint16(32, 2, true);
    view.setUint16(34, 16, true);
    writeString(view, 36, 'data');
    view.setUint32(40, samples.length * 2, true);
    floatTo16BitPCM(view, 44, samples);

    return view;
  }
  `], { type: "application/javascript" }));        

  var Recorder = function(source, cfg){
    var config = cfg || {};
    var bufferLen = config.bufferLen || 4096;
    this.context = source.context;
    this.node = this.context.createScriptProcessor(bufferLen, 2, 2);

    var worker = new Worker(WORKER_PATH);
    worker.postMessage({
      command: 'init',
      config: { sampleRate: this.context.sampleRate }
    });

    var recording = false, currCallback;
    this.node.onaudioprocess = function(e){
      if (!recording) return;
      var buffer = [
        e.inputBuffer.getChannelData(0),
        e.inputBuffer.getChannelData(1)
      ];
      worker.postMessage({ command: 'record', buffer: buffer });
    };

    this.record = () => recording = true;
    this.stop = () => recording = false;
    this.clear = () => worker.postMessage({ command: 'clear' });
    this.exportWAV = function(cb, type){
      currCallback = cb;
      type = type || 'audio/wav';
      worker.postMessage({ command: 'exportWAV', type: type });
    };
    worker.onmessage = function(e){ currCallback(e.data); };

    source.connect(this.node);
    this.node.connect(this.context.destination);
  };

  window.Recorder = Recorder;
})(window);