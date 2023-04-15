const fsp = require('fs').promises
const readline = require('readline');

export interface FileReader {
    readFile(path: string): Promise<string>
}

export class FileSystemFileReader implements FileReader {
    readFile(path: string): Promise<string> {
        return fsp.readFile(path)
    }
}