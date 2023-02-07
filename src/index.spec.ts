import {hello} from "./index";

describe('index.ts', () =>{
    it('should return Hello', () => {
        expect(hello()).toBe('Hello!')
    })
});