const fsp = require('fs').promises

export interface FileReader {
    readFile(path: string): Promise<string>
}

export class FileSystemFileReader implements FileReader {
    readFile(path: string): Promise<string> {
        return fsp.readFile(path)
    }
}