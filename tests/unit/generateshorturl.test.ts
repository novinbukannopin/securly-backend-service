import { v4 as uuid } from 'uuid';
import { generateShortURL } from '../../src/services/link.service';

jest.mock('uuid', () => ({
  v4: jest.fn()
}));

describe('generateShortURL', () => {
  it('should return the provided shortURL if it exists', async () => {
    const providedShortURL = 'customURL';

    const result = await generateShortURL(providedShortURL);

    expect(result).toBe(providedShortURL);
  });

  it('should generate a new short URL if shortURL is not provided', async () => {
    (uuid as jest.Mock).mockReturnValue('12345678-1234-5678-1234-567812345678');
    const result = await generateShortURL();

    expect(result).toBe('12345678');
    expect(uuid).toHaveBeenCalled();
  });
});
