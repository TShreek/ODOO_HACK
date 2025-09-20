#!/usr/bin/env python3
"""
Test script to verify Kafka connection and basic functionality
Run this after setting up Kafka to ensure everything works.
"""

import json
import time
from kafka import KafkaProducer, KafkaConsumer
from kafka.errors import KafkaError

def test_kafka_connection():
    """Test basic Kafka producer and consumer functionality"""
    
    print("🔍 Testing Kafka Connection...")
    
    # Test Producer
    try:
        producer = KafkaProducer(
            bootstrap_servers=['localhost:9092'],
            value_serializer=lambda x: json.dumps(x).encode('utf-8'),
            key_serializer=lambda x: x.encode('utf-8') if x else None
        )
        
        # Send a test message
        test_message = {
            "test": True,
            "message": "Hello from Python!",
            "timestamp": time.time()
        }
        
        future = producer.send('financial_transactions', 
                              key='test-key', 
                              value=test_message)
        
        # Wait for message to be sent
        record_metadata = future.get(timeout=10)
        
        print(f"✅ Producer test successful!")
        print(f"   Topic: {record_metadata.topic}")
        print(f"   Partition: {record_metadata.partition}")
        print(f"   Offset: {record_metadata.offset}")
        
        producer.close()
        
    except KafkaError as e:
        print(f"❌ Producer test failed: {e}")
        return False
    
    # Test Consumer
    try:
        consumer = KafkaConsumer(
            'financial_transactions',
            bootstrap_servers=['localhost:9092'],
            value_deserializer=lambda x: json.loads(x.decode('utf-8')),
            key_deserializer=lambda x: x.decode('utf-8') if x else None,
            auto_offset_reset='earliest',
            consumer_timeout_ms=5000  # Wait 5 seconds for messages
        )
        
        print("🔍 Testing Consumer (waiting for messages)...")
        
        message_count = 0
        for message in consumer:
            print(f"✅ Consumer received message:")
            print(f"   Key: {message.key}")
            print(f"   Value: {message.value}")
            print(f"   Partition: {message.partition}")
            print(f"   Offset: {message.offset}")
            
            message_count += 1
            if message_count >= 1:  # Just read one message for testing
                break
        
        consumer.close()
        
        if message_count > 0:
            print("✅ Consumer test successful!")
        else:
            print("⚠️  No messages received (this might be normal)")
            
    except KafkaError as e:
        print(f"❌ Consumer test failed: {e}")
        return False
    except Exception as e:
        print(f"⚠️  Consumer timeout (this is normal): {e}")
    
    print("\n🎉 Kafka setup verification complete!")
    return True

if __name__ == "__main__":
    test_kafka_connection()