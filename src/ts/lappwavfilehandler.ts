/**
 * 版权所有（c）Live2D股份有限公司保留所有权利.
 *
 * 此源代码的使用受Live2D开放软件许可证的管辖
 * that can be found at https://www.live2d.com/eula/live2d-open-software-license-agreement_en.html.
 */

import { LAppPal } from './lapppal';

export let s_instance: LAppWavFileHandler = null;

export class LAppWavFileHandler {
  /**
   * 返回类的实例(single ton)
   * 如果没有生成实例，则在内部生成实例
   *
   * @return 类的实例
   */
  public static getInstance(): LAppWavFileHandler {
    if (s_instance == null) {
      s_instance = new LAppWavFileHandler();
    }

    return s_instance;
  }

  /**
   * 释放类的实例
   */
  public static releaseInstance(): void {
    if (s_instance != null) {
      s_instance = void 0;
    }

    s_instance = null;
  }

  public update(deltaTimeSeconds: number) {
    let goalOffset: number;
    let rms: number;

    // 数据加载前/达到文件末尾时不更新
    if (
      this._pcmData == null ||
      this._sampleOffset >= this._wavFileInfo._samplesPerChannel
    ) {
      this._lastRms = 0.0;
      return false;
    }

    // 保持经过一段时间后的状态
    this._userTimeSeconds += deltaTimeSeconds;
    goalOffset = Math.floor(
      this._userTimeSeconds * this._wavFileInfo._samplingRate
    );
    if (goalOffset > this._wavFileInfo._samplesPerChannel) {
      goalOffset = this._wavFileInfo._samplesPerChannel;
    }

    // RMS計測
    rms = 0.0;
    for (
      let channelCount = 0;
      channelCount < this._wavFileInfo._numberOfChannels;
      channelCount++
    ) {
      for (
        let sampleCount = this._sampleOffset;
        sampleCount < goalOffset;
        sampleCount++
      ) {
        const pcm = this._pcmData[channelCount][sampleCount];
        rms += pcm * pcm;
      }
    }
    rms = Math.sqrt(
      rms /
        (this._wavFileInfo._numberOfChannels *
          (goalOffset - this._sampleOffset))
    );

    this._lastRms = rms;
    this._sampleOffset = goalOffset;
    return true;
  }

  public start(filePath: string): void {
    // 初始化样本位参照位置
    this._sampleOffset = 0;
    this._userTimeSeconds = 0.0;

    // 重置RMS值
    this._lastRms = 0.0;

    if (!this.loadWavFile(filePath)) {
      return;
    }
  }

  public getRms(): number {
    return this._lastRms;
  }

  public loadWavFile(filePath: string): boolean {
    let ret = false;

    if (this._pcmData != null) {
      this.releasePcmData();
    }

    // 文件载入
    const asyncFileLoad = async () => {
      return fetch(filePath).then(responce => {
        return responce.arrayBuffer();
      });
    };

    const asyncWavFileManager = (async () => {
      this._byteReader._fileByte = await asyncFileLoad();
      this._byteReader._fileDataView = new DataView(this._byteReader._fileByte);
      this._byteReader._fileSize = this._byteReader._fileByte.byteLength;
      this._byteReader._readOffset = 0;

      // 如果文件加载失败，或者没有放入开头的签名“RIFF”的尺寸，则失败
      if (
        this._byteReader._fileByte == null ||
        this._byteReader._fileSize < 4
      ) {
        return false;
      }

      // 文件名
      this._wavFileInfo._fileName = filePath;

      try {
        // 签名“RIFF”
        if (!this._byteReader.getCheckSignature('RIFF')) {
          ret = false;
          throw new Error('Cannot find Signeture "RIFF".');
        }
        // 文件大小-8(跳过)
        this._byteReader.get32LittleEndian();
        // 签名“WAVE”
        if (!this._byteReader.getCheckSignature('WAVE')) {
          ret = false;
          throw new Error('Cannot find Signeture "WAVE".');
        }
        // 签名"fmt "
        if (!this._byteReader.getCheckSignature('fmt ')) {
          ret = false;
          throw new Error('Cannot find Signeture "fmt".');
        }
        // fmt信息块大小
        const fmtChunkSize = this._byteReader.get32LittleEndian();
        // 格式ID不接受1(线性PCM)以外的格式
        if (this._byteReader.get16LittleEndian() != 1) {
          ret = false;
          throw new Error('File is not linear PCM.');
        }
        // 频道数
        this._wavFileInfo._numberOfChannels =
          this._byteReader.get16LittleEndian();
        // 取样速率
        this._wavFileInfo._samplingRate = this._byteReader.get32LittleEndian();
        // 数据速度[byte/sec](跳过)
        this._byteReader.get32LittleEndian();
        // 块大小(跳过)
        this._byteReader.get16LittleEndian();
        // 量化比特数
        this._wavFileInfo._bitsPerSample = this._byteReader.get16LittleEndian();
        // fmt信息块扩展部分的跳过
        if (fmtChunkSize > 16) {
          this._byteReader._readOffset += fmtChunkSize - 16;
        }
        // 跳过直到出现“数据”块
        while (
          !this._byteReader.getCheckSignature('data') &&
          this._byteReader._readOffset < this._byteReader._fileSize
        ) {
          this._byteReader._readOffset +=
            this._byteReader.get32LittleEndian() + 4;
        }
        // 文件中没有出现“数据”块
        if (this._byteReader._readOffset >= this._byteReader._fileSize) {
          ret = false;
          throw new Error('Cannot find "data" Chunk.');
        }
        // 样本数
        {
          const dataChunkSize = this._byteReader.get32LittleEndian();
          this._wavFileInfo._samplesPerChannel =
            (dataChunkSize * 8) /
            (this._wavFileInfo._bitsPerSample *
              this._wavFileInfo._numberOfChannels);
        }
        // 区域确保
        this._pcmData = new Array(this._wavFileInfo._numberOfChannels);
        for (
          let channelCount = 0;
          channelCount < this._wavFileInfo._numberOfChannels;
          channelCount++
        ) {
          this._pcmData[channelCount] = new Float32Array(
            this._wavFileInfo._samplesPerChannel
          );
        }
        // 获取波形数据
        for (
          let sampleCount = 0;
          sampleCount < this._wavFileInfo._samplesPerChannel;
          sampleCount++
        ) {
          for (
            let channelCount = 0;
            channelCount < this._wavFileInfo._numberOfChannels;
            channelCount++
          ) {
            this._pcmData[channelCount][sampleCount] = this.getPcmSample();
          }
        }

        ret = true;
      } catch (e) {
        console.log(e);
      }
    })();

    return ret;
  }

  public getPcmSample(): number {
    let pcm32;

    // 扩展到32位宽，然后在-1到1的范围内缩小
    switch (this._wavFileInfo._bitsPerSample) {
      case 8:
        pcm32 = this._byteReader.get8() - 128;
        pcm32 <<= 24;
        break;
      case 16:
        pcm32 = this._byteReader.get16LittleEndian() << 16;
        break;
      case 24:
        pcm32 = this._byteReader.get24LittleEndian() << 8;
        break;
      default:
        // 不对应的比特宽度
        pcm32 = 0;
        break;
    }

    return pcm32 / 2147483647; //Number.MAX_VALUE;
  }

  public releasePcmData(): void {
    for (
      let channelCount = 0;
      channelCount < this._wavFileInfo._numberOfChannels;
      channelCount++
    ) {
      delete this._pcmData[channelCount];
    }
    delete this._pcmData;
    this._pcmData = null;
  }

  constructor() {
    this._pcmData = null;
    this._userTimeSeconds = 0.0;
    this._lastRms = 0.0;
    this._sampleOffset = 0.0;
    this._wavFileInfo = new WavFileInfo();
    this._byteReader = new ByteReader();
  }

  _pcmData: Array<Float32Array>;
  _userTimeSeconds: number;
  _lastRms: number;
  _sampleOffset: number;
  _wavFileInfo: WavFileInfo;
  _byteReader: ByteReader;
  _loadFiletoBytes = (arrayBuffer: ArrayBuffer, length: number): void => {
    this._byteReader._fileByte = arrayBuffer;
    this._byteReader._fileDataView = new DataView(this._byteReader._fileByte);
    this._byteReader._fileSize = length;
  };
}

export class WavFileInfo {
  constructor() {
    this._fileName = '';
    this._numberOfChannels = 0;
    this._bitsPerSample = 0;
    this._samplingRate = 0;
    this._samplesPerChannel = 0;
  }

  _fileName: string; ///< 文件名
  _numberOfChannels: number; ///< 频道数
  _bitsPerSample: number; ///< 每样本比特数
  _samplingRate: number; ///< 取样速率
  _samplesPerChannel: number; ///< 每个频道的总样本数
}

export class ByteReader {
  constructor() {
    this._fileByte = null;
    this._fileDataView = null;
    this._fileSize = 0;
    this._readOffset = 0;
  }

  /**
   * @brief 8比特读入
   * @return Csm::csmUint8 读取的8比特值
   */
  public get8(): number {
    const ret = this._fileDataView.getUint8(this._readOffset);
    this._readOffset++;
    return ret;
  }

  /**
   * @brief 16位读入
   * @return Csm::csmUint16 读取的16比特值
   */
  public get16LittleEndian(): number {
    const ret =
      (this._fileDataView.getUint8(this._readOffset + 1) << 8) |
      this._fileDataView.getUint8(this._readOffset);
    this._readOffset += 2;
    return ret;
  }

  /**
   * @brief 24位读入
   * @return Csm::csmUint32 读取的24位值(设定为下位24位)
   */
  public get24LittleEndian(): number {
    const ret =
      (this._fileDataView.getUint8(this._readOffset + 2) << 16) |
      (this._fileDataView.getUint8(this._readOffset + 1) << 8) |
      this._fileDataView.getUint8(this._readOffset);
    this._readOffset += 3;
    return ret;
  }

  /**
   * @brief 32位读入
   * @return Csm::csmUint32 读取的32位值
   */
  public get32LittleEndian(): number {
    const ret =
      (this._fileDataView.getUint8(this._readOffset + 3) << 24) |
      (this._fileDataView.getUint8(this._readOffset + 2) << 16) |
      (this._fileDataView.getUint8(this._readOffset + 1) << 8) |
      this._fileDataView.getUint8(this._readOffset);
    this._readOffset += 4;
    return ret;
  }

  /**
   * @brief 签名的获取和与参考字符串的匹配检查
   * @param[in] reference 被检查的签名字符串
   * @retval  true    一致
   * @retval  false   不一致
   */
  public getCheckSignature(reference: string): boolean {
    const getSignature: Uint8Array = new Uint8Array(4);
    const referenceString: Uint8Array = new TextEncoder().encode(reference);
    if (reference.length != 4) {
      return false;
    }
    for (let signatureOffset = 0; signatureOffset < 4; signatureOffset++) {
      getSignature[signatureOffset] = this.get8();
    }
    return (
      getSignature[0] == referenceString[0] &&
      getSignature[1] == referenceString[1] &&
      getSignature[2] == referenceString[2] &&
      getSignature[3] == referenceString[3]
    );
  }

  _fileByte: ArrayBuffer; ///< 加载文件的字节列
  _fileDataView: DataView;
  _fileSize: number; ///< 文件大小
  _readOffset: number; ///< 文件参考位置
}
