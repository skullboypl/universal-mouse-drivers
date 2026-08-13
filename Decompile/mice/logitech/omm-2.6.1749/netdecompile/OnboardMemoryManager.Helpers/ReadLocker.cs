using System;
using System.Threading;

namespace OnboardMemoryManager.Helpers;

public struct ReadLocker : IDisposable
{
	private ReaderWriterLockSlim _rwlock;

	public ReadLocker(ReaderWriterLockSlim rwlock, int timeout = -1)
	{
		_rwlock = rwlock;
		_rwlock.TryEnterReadLock(timeout);
	}

	public void Dispose()
	{
		_rwlock.ExitReadLock();
	}
}
