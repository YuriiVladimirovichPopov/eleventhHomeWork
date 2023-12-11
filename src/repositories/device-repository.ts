import { DeviceMongoDbType } from "../types";
import { DeviceModel } from "../domain/schemas/device.schema";

class DeviceRepository {
  // may be come through to deviceQueryRepository
  async findDeviceByUser(deviceId: string): Promise<DeviceMongoDbType | null> {
    try {
      const device = await DeviceModel.findOne({ deviceId });
      return device;
    } catch (error) {
      console.error("Error finding device by ID:", error);
      return null;
    }
  }
  // may be come through to deviceQueryRepository
  async getAllDevicesByUser(userId: string): Promise<DeviceMongoDbType[]> {
    try {
      const devices = await DeviceModel.find(
        { userId },
        { projection: { _id: 0, userId: 0 } },
      ).lean();
      return devices;
    } catch (error) {
      console.error("Error getting devices by userId:", error);
      return [];
    }
  }

  async deleteDeviceById(deviceId: string): Promise<boolean> {
    try {
      const result = await DeviceModel.deleteOne({ deviceId });
      if (result.deletedCount === 1) {
        return true;
      } else {
        return false;
      }
    } catch (error) {
      console.log("Error deleting device by ID:", error);
      return false;
    }
  }

  async deleteAllDevicesExceptCurrent(
    userId: string,
    deviceId: string,
  ): Promise<boolean> {
    try {
      await DeviceModel.deleteMany({ userId, deviceId: { $ne: deviceId } });
      return true;
    } catch (error) {
      throw new Error("Failed to refresh tokens");
    }
  }
  
  async deleteAllDevices(): Promise<boolean> {
    try {
      const result = await DeviceModel.deleteMany({});
      return result.acknowledged === true;
    } catch (error) {
      return false;
    }
  }
}

export const deviceRepository = new DeviceRepository()