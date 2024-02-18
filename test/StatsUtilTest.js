import { countDailyStats } from "../utils/StatsUtil";

describe('countDailyStats function', () => {
  test('should calculate total finished price correctly for orders on a given date', async () => {
    const date = '2022-01-01';
    const expectedTotalFinishedPrice = 100;
    
    // Mock getOrdersByDate function to return sample orders
    const mockGetOrdersByDate = jest.fn().mockResolvedValue([
      { id: 1, totalPrice: 50 },
      { id: 2, totalPrice: 50 }
    ]);
    
    // Mock calculateTotalFinishedPrice and adjustTotalFinishedPrice functions
    jest.mock('./yourFile', () => ({
      getOrdersByDate: mockGetOrdersByDate,
      calculateTotalFinishedPrice: jest.fn(order => order.totalPrice),
      adjustTotalFinishedPrice: jest.fn((order, total) => total + order.totalPrice)
    }));
    
    await countDailyStats(date);
    
    expect(mockGetOrdersByDate).toHaveBeenCalledWith(date);
    expect(mockGetOrdersByDate).toHaveBeenCalledTimes(1);
    expect(calculateTotalFinishedPrice).toHaveBeenCalledTimes(2);
    expect(adjustTotalFinishedPrice).toHaveBeenCalledTimes(2);
    expect(adjustTotalFinishedPrice).toHaveBeenLastCalledWith({ id: 2, totalPrice: 50 }, 100);
  });
  
  test('should handle no orders on a given date', async () => {
    const date = '2022-01-01';
    
    // Mock getOrdersByDate function to return an empty array
    const mockGetOrdersByDate = jest.fn().mockResolvedValue([]);
    
    jest.mock('./yourFile', () => ({
      getOrdersByDate: mockGetOrdersByDate
    }));
    
    await countDailyStats(date);
    
    expect(mockGetOrdersByDate).toHaveBeenCalledWith(date);
    expect(mockGetOrdersByDate).toHaveBeenCalledTimes(1);
  });
});